from __future__ import annotations

from dataclasses import dataclass

import pygame


SCREEN_WIDTH = 1100
SCREEN_HEIGHT = 700
FPS = 120

PLAYER_RADIUS = 14
PLAYER_SPEED = 260.0

BACKGROUND = (7, 10, 18)
DESKTOP_BACKGROUND = (17, 22, 34)
FRAGMENT_BACKGROUND = (28, 35, 51)
FRAGMENT_BORDER = (92, 106, 133)
PLAYER_COLOR = (139, 233, 253)
PLAYER_GLOW = (53, 217, 255)
TEXT_COLOR = (220, 225, 235)
GAP_PLAYER_COLOR = (255, 110, 130)


@dataclass(frozen=True)
class WindowFragment:
    name: str
    rect: pygame.Rect


WINDOW_FRAGMENTS = (
    WindowFragment("Window A", pygame.Rect(80, 110, 360, 260)),
    WindowFragment("Window B", pygame.Rect(475, 180, 330, 290)),
    WindowFragment("Window C", pygame.Rect(700, 500, 300, 150)),
)

START_POSITION = pygame.Vector2(WINDOW_FRAGMENTS[0].rect.center)


def handle_movement(player: pygame.Vector2, delta_time: float) -> None:
    keys = pygame.key.get_pressed()
    direction = pygame.Vector2(int(keys[pygame.K_d] or keys[pygame.K_RIGHT])- int(keys[pygame.K_a] or keys[pygame.K_LEFT]),int(keys[pygame.K_s] or keys[pygame.K_DOWN])
        - int(keys[pygame.K_w] or keys[pygame.K_UP]),
    )

    if direction.length_squared() > 0:
        direction = direction.normalize()
        player += direction * PLAYER_SPEED * delta_time

    # Keep the player within the simulated desktop.
    player.x = max(PLAYER_RADIUS, min(SCREEN_WIDTH - PLAYER_RADIUS, player.x))
    player.y = max(PLAYER_RADIUS + 60, min(SCREEN_HEIGHT - PLAYER_RADIUS, player.y))


def player_is_inside(fragment: WindowFragment, player: pygame.Vector2) -> bool:
    """Return True when the player's center is visible in a fragment."""
    return fragment.rect.collidepoint(player.x, player.y)


def draw_player(
    surface: pygame.Surface,
    position: pygame.Vector2,
    color: tuple[int, int, int] = PLAYER_COLOR,
) -> None:
    center = (round(position.x), round(position.y))

    glow = pygame.Surface(
        (PLAYER_RADIUS * 4, PLAYER_RADIUS * 4), pygame.SRCALPHA
    )
    glow_center = (glow.get_width() // 2, glow.get_height() // 2)
    pygame.draw.circle(
        glow,
        (*PLAYER_GLOW, 55),
        glow_center,
        round(PLAYER_RADIUS * 1.8),
    )
    surface.blit(
        glow,
        (
            center[0] - glow_center[0],
            center[1] - glow_center[1],
        ),
    )

    pygame.draw.circle(surface, color, center, PLAYER_RADIUS)
    pygame.draw.circle(
        surface,
        (255, 255, 255),
        (center[0] - 4, center[1] - 5),
        3,
    )


def draw_fragment(
    screen: pygame.Surface,
    fragment: WindowFragment,
    player: pygame.Vector2,
    font: pygame.font.Font,
) -> None:
    """Draw one clipped view of the shared desktop."""
    pygame.draw.rect(screen, FRAGMENT_BACKGROUND, fragment.rect)

    # set_clip behaves like a browser canvas clipped by its window bounds.
    old_clip = screen.get_clip()
    screen.set_clip(fragment.rect)
    if player_is_inside(fragment, player):
        draw_player(screen, player)
    screen.set_clip(old_clip)

    pygame.draw.rect(screen, FRAGMENT_BORDER, fragment.rect, width=3, border_radius=4)
    label = font.render(fragment.name, True, TEXT_COLOR)
    screen.blit(label, (fragment.rect.x + 12, fragment.rect.y + 10))


def draw_scene(
    screen: pygame.Surface,
    fragments: tuple[WindowFragment, ...],
    player: pygame.Vector2,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    show_debug_player: bool,
) -> None:
    screen.fill(BACKGROUND)

    desktop_rect = pygame.Rect(24, 70, SCREEN_WIDTH - 48, SCREEN_HEIGHT - 94)
    pygame.draw.rect(screen, DESKTOP_BACKGROUND, desktop_rect, border_radius=8)

    title = font.render("Window Maze — Pygame Prototype", True, TEXT_COLOR)
    instructions = small_font.render(
        "WASD / arrows: move    R: reset    F1: debug dot    Esc: quit",
        True,
        TEXT_COLOR,
    )
    screen.blit(title, (24, 18))
    screen.blit(instructions, (24, 47))

    for fragment in fragments:
        draw_fragment(screen, fragment, player, small_font)

    visible_fragment = next(
        (fragment.name for fragment in fragments if player_is_inside(fragment, player)),
        None,
    )

    if show_debug_player:
        debug_color = PLAYER_COLOR if visible_fragment else GAP_PLAYER_COLOR
        pygame.draw.circle(
            screen,
            debug_color,
            (round(player.x), round(player.y)),
            PLAYER_RADIUS + 5,
            width=2,
        )

    location = visible_fragment or "desktop gap (hidden in the real window view)"
    status = small_font.render(
        f"Global position: ({player.x:6.1f}, {player.y:6.1f})   Visible in: {location}",
        True,
        TEXT_COLOR,
    )
    screen.blit(status, (24, SCREEN_HEIGHT - 22))

    pygame.display.flip()


def main() -> None:
    pygame.init()
    pygame.display.set_caption("Window Maze Prototype")
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 30)
    small_font = pygame.font.Font(None, 22)

    player = START_POSITION.copy()
    show_debug_player = True
    running = True

    while running:
        delta_time = min(clock.tick(FPS) / 1000.0, 0.05)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_r:
                    player.update(START_POSITION)
                elif event.key == pygame.K_F1:
                    show_debug_player = not show_debug_player

        handle_movement(player, delta_time)
        draw_scene(
            screen,
            WINDOW_FRAGMENTS,
            player,
            font,
            small_font,
            show_debug_player,
        )

    pygame.quit()


if __name__ == "__main__":
    main()
