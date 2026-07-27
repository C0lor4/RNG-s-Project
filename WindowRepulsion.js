const DEFAULT_ALLOWED_OVERLAP = 16;
const CORNER_DIFFERENCE = 16;
const RELEASE_DELAY = 140;
const UPDATE_INTERVAL = 20;

/**
 * Centrally manages collisions between popup windows.
 *
 * The start page owns the popup references, so it can move the window that
 * was not being dragged. Browser title-bar mouse events are unavailable to
 * JavaScript, so a short period without movement is treated as mouse release.
 */
class WindowRepulsion {
	constructor(allowedOverlap = DEFAULT_ALLOWED_OVERLAP) {
		this.allowedOverlap = allowedOverlap;
		this.windows = [];
		this.timer = window.setInterval(() => this.update(), UPDATE_INTERVAL);
	}

	addWindow(popup, id) {
		if (!popup) return;

		this.windows.push({
			id,
			popup,
			x: popup.screenX,
			y: popup.screenY,
			width: popup.outerWidth,
			height: popup.outerHeight,
			lastMovedAt: performance.now(),
			movement: 0,
			ignoreMovementUntil: 0
		});
	}

	update() {
		const currentTime = performance.now();

		this.windows = this.windows.filter((item) => !item.popup.closed);

		for (const item of this.windows) {
			this.updateWindowInformation(item, currentTime);
		}

		for (let firstIndex = 0; firstIndex < this.windows.length; firstIndex += 1) {
			for (
				let secondIndex = firstIndex + 1;
				secondIndex < this.windows.length;
				secondIndex += 1
			) {
				this.resolveCollision(
					this.windows[firstIndex],
					this.windows[secondIndex],
					currentTime
				);
			}
		}
	}

	updateWindowInformation(item, currentTime) {
		const newX = item.popup.screenX;
		const newY = item.popup.screenY;
		const movement = Math.hypot(newX - item.x, newY - item.y);

		item.x = newX;
		item.y = newY;
		item.width = item.popup.outerWidth;
		item.height = item.popup.outerHeight;

		if (currentTime < item.ignoreMovementUntil) {
			item.movement = 0;
		} else {
			item.movement = movement;
		}

		if (item.movement > 0) {
			item.lastMovedAt = currentTime;
		}
	}

	resolveCollision(first, second, currentTime) {
		const overlapX =
			Math.min(first.x + first.width, second.x + second.width) -
			Math.max(first.x, second.x);
		const overlapY =
			Math.min(first.y + first.height, second.y + second.height) -
			Math.max(first.y, second.y);

		if (
			overlapX <= this.allowedOverlap ||
			overlapY <= this.allowedOverlap
		) {
			return;
		}

		const dragged = this.getDraggedWindow(first, second);
		const pushed = dragged === first ? second : first;
		const isCornerCollision =
			Math.abs(overlapX - overlapY) <= CORNER_DIFFERENCE;
		const dragHasStopped =
			currentTime - dragged.lastMovedAt >= RELEASE_DELAY;

		// Corner collisions can switch axes repeatedly during a drag. Wait
		// until movement stops, then teleport the other window away once.
		if (isCornerCollision && !dragHasStopped) return;

		if (isCornerCollision) {
			this.teleportWindow(pushed, currentTime);
		} else {
			this.pushWindow(dragged, pushed, overlapX, overlapY, currentTime);
		}
	}

	getDraggedWindow(first, second) {
		if (first.movement !== second.movement) {
			return first.movement > second.movement ? first : second;
		}

		if (first.lastMovedAt !== second.lastMovedAt) {
			return first.lastMovedAt > second.lastMovedAt ? first : second;
		}

		return first.id < second.id ? first : second;
	}

	pushWindow(dragged, pushed, overlapX, overlapY, currentTime) {
		const draggedCenterX = dragged.x + dragged.width / 2;
		const draggedCenterY = dragged.y + dragged.height / 2;
		const pushedCenterX = pushed.x + pushed.width / 2;
		const pushedCenterY = pushed.y + pushed.height / 2;
		let x = pushed.x;
		let y = pushed.y;

		if (overlapX < overlapY) {
			x = draggedCenterX < pushedCenterX
				? dragged.x + dragged.width - this.allowedOverlap
				: dragged.x - pushed.width + this.allowedOverlap;
		} else {
			y = draggedCenterY < pushedCenterY
				? dragged.y + dragged.height - this.allowedOverlap
				: dragged.y - pushed.height + this.allowedOverlap;
		}

		const bounds = getAvailableScreenBounds();

		const hasSpace =
			x >= bounds.left &&
			y >= bounds.top &&
			x + pushed.width <= bounds.right &&
			y + pushed.height <= bounds.bottom;

		if (!hasSpace) {
			this.teleportWindow(pushed, currentTime);
			return;
		}

		this.moveWindow(pushed, x, y, currentTime);
	}

	teleportWindow(pushed, currentTime) {
		const bounds = getAvailableScreenBounds();
		const maximumX = bounds.right - pushed.width;
		const maximumY = bounds.bottom - pushed.height;

		for (let attempt = 0; attempt < 100; attempt += 1) {
			const x = randomInteger(bounds.left, maximumX);
			const y = randomInteger(bounds.top, maximumY);
			const position = {
				x,
				y,
				width: pushed.width,
				height: pushed.height
			};

			const overlaps = this.windows.some((other) => (
				other !== pushed &&
				windowsOverlap(position, other, this.allowedOverlap)
			));

			if (!overlaps) {
				this.moveWindow(pushed, x, y, currentTime);
				return;
			}
		}

		for (let y = bounds.top; y <= maximumY; y += 10) {
			for (let x = bounds.left; x <= maximumX; x += 10) {
				const position = {
					x,
					y,
					width: pushed.width,
					height: pushed.height
				};

				const overlaps = this.windows.some((other) => (
					other !== pushed &&
					windowsOverlap(position, other, this.allowedOverlap)
				));

				if (!overlaps) {
					this.moveWindow(pushed, x, y, currentTime);
					return;
				}
			}
		}
	}

	moveWindow(pushed, x, y, currentTime) {
		pushed.x = Math.round(x);
		pushed.y = Math.round(y);
		pushed.movement = 0;
		pushed.ignoreMovementUntil = currentTime + RELEASE_DELAY;
		pushed.popup.moveTo(pushed.x, pushed.y);
	}
}

function windowsOverlap(first, second, allowedOverlap) {
	return (
		first.x < second.x + second.width - allowedOverlap &&
		first.x + first.width - allowedOverlap > second.x &&
		first.y < second.y + second.height - allowedOverlap &&
		first.y + first.height - allowedOverlap > second.y
	);
}

function randomInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function getAvailableScreenBounds() {
	const left = Number.isFinite(screen.availLeft) ? screen.availLeft : 0;
	const top = Number.isFinite(screen.availTop) ? screen.availTop : 0;

	return {
		left,
		top,
		right: left + screen.availWidth,
		bottom: top + screen.availHeight
	};
}

export default WindowRepulsion;
