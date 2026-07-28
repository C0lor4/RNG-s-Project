const SPEED = 1.5;
const SIZE = 0.7;
const ANIMATION_SPEED = 8;
const IDLE_ANIMATION_DELAY = 5000;
const MOVEMENT_KEYS = new Set(["w","a","s","d","arrowup","arrowleft","arrowdown","arrowright"]);

class Player {
	constructor() {
		this.x = 1;
		this.y = 1;
		this.maze = [];
		this.keys = new Set();
		this.frame = 0;
		this.animationRow = 0;
		this.animationTime = 0;
		this.lastMovementTime = performance.now();
		this.movedRemotely = false;
		this.image = new Image();
		this.image.src = "./Sprite.png";

		window.addEventListener("keydown", (event) => {
			const key = event.key.toLowerCase();

			if (MOVEMENT_KEYS.has(key)) {
				event.preventDefault();
				this.keys.add(key);
			}
		});

		window.addEventListener("keyup", (event) => {
			this.keys.delete(event.key.toLowerCase());
		});

		window.addEventListener("blur", () => this.keys.clear());
	}

	setPosition({x, y}) {
		const deltaX = x - this.x;
		const deltaY = y - this.y;

		this.x = x;
		this.y = y;

		if (deltaX || deltaY) {
			this.setAnimationRow(deltaX, deltaY);
			this.lastMovementTime = performance.now();
			this.movedRemotely = true;
		}
	}

	setMaze(maze) {
		this.maze = maze;
	}

	check(x, y) {
		const column = Math.floor(y + 0.5);
		return (this.maze[Math.floor(x + 0.5)]?.[column] === 1 && this.maze[Math.floor(x + SIZE / 2 + 0.5)]?.[column] === 1);
	}

	update(deltaTime) {
		const moveX = Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup"));
		const moveY = Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft"));
		const length = Math.hypot(moveX, moveY);
		let moved = this.movedRemotely;
		this.movedRemotely = false;

		if (length) {
			const distance = SPEED * deltaTime / length;
			const oldX = this.x;
			const oldY = this.y;
			const nextX = this.x + moveX * distance;
			const nextY = this.y + moveY * distance;

			if (this.check(nextX, this.y)) this.x = nextX;
			if (this.check(this.x, nextY)) this.y = nextY;

			if (this.x !== oldX || this.y !== oldY) {
				moved = true;
				this.setAnimationRow(moveX, moveY);
				this.lastMovementTime = performance.now();

				window.opener.postMessage(
					{ type: "move", x: this.x, y: this.y },
					window.location.origin
				);
			}
		}

		if (!moved) this.setAnimationRow(0, 0);

		if (
			!moved &&
			performance.now() - this.lastMovementTime < IDLE_ANIMATION_DELAY
		) {
			this.animationTime = 0;
			this.frame = 0;
			return;
		}

		this.animationTime += deltaTime;
		this.frame =
			Math.floor(this.animationTime * ANIMATION_SPEED) % 4;
	}

	setAnimationRow(moveX, moveY) {
		let row = 0;

		if (moveY === 0 && moveX > 0) row = 1;
		if (moveY === 0 && moveX < 0) row = 2;

		if (row !== this.animationRow) {
			this.animationRow = row;
			this.animationTime = 0;
			this.frame = 0;
		}
	}

	draw(context, startX, startY, cellWidth, cellHeight) {
		if (!this.image.complete) return;

		const size = Math.min(cellWidth, cellHeight) * SIZE;
		const centerX = (this.y - startY + 0.5) * cellWidth;
		const centerY = (this.x - startX + 0.5) * cellHeight;
		const outsideWindow =
			centerX + size / 2 <= 0 ||
			centerX - size / 2 >= context.canvas.width ||
			centerY + size / 2 <= 0 ||
			centerY - size / 2 >= context.canvas.height;

		if (outsideWindow) return;

		context.imageSmoothingEnabled = false;
		context.drawImage(
			this.image,
			this.frame * 32,
			this.animationRow * 32,
			32,
			32,
			centerX - size / 2,
			centerY - size / 2,
			size,
			size
		);
	}
}

export default Player;
