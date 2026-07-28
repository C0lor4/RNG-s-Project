const SPEED = 1.5;
const SIZE = 0.7;
const FEET_OFFSET = SIZE / 2;
const SOURCE = { x: 10, y: 15, width: 75, height: 170 };
const MOVEMENT_KEYS = new Set(["w","a","s","d","arrowup","arrowleft","arrowdown","arrowright"]);

class Player {
	constructor() {
		this.x = 1;
		this.y = 1;
		this.maze = [];
		this.keys = new Set();
		this.image = new Image();
		this.image.src = "./Player.png";

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

	setPosition({ x, y }) {
		this.x = x;
		this.y = y;
	}

	setMaze(maze) {
		this.maze = maze;
	}

	isPath(x, y) {
		const row = Math.floor(x + 0.5);
		const column = Math.floor(y + 0.5);
		return this.maze[row]?.[column] === 1;
	}

	canStand(x, y) {
		return this.isPath(x, y) && this.isPath(x + FEET_OFFSET, y);
	}

	update(deltaTime) {
		const moveX = Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup"));
		const moveY = Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft"));
		const length = Math.hypot(moveX, moveY);

		if (length === 0) return;

		const distance = SPEED * deltaTime / length;
		const oldX = this.x;
		const oldY = this.y;
		const nextX = this.x + moveX * distance;
		const nextY = this.y + moveY * distance;

		if (this.canStand(nextX, this.y)) this.x = nextX;
		if (this.canStand(this.x, nextY)) this.y = nextY;

		if (this.x === oldX && this.y === oldY) return;

		window.opener.postMessage(
			{ type: "move", x: this.x, y: this.y },
			window.location.origin
		);
	}

	draw(context, startX, startY, cellWidth, cellHeight) {
		if (!this.image.complete) return;

		const scale = Math.min(
			cellWidth * SIZE / SOURCE.width,
			cellHeight * SIZE / SOURCE.height
		);
		const width = SOURCE.width * scale;
		const height = SOURCE.height * scale;
		const centerX = (this.y - startY + 0.5) * cellWidth;
		const centerY = (this.x - startX + 0.5) * cellHeight;
		const outsideWindow =
			centerX + width / 2 <= 0 ||
			centerX - width / 2 >= context.canvas.width ||
			centerY + height / 2 <= 0 ||
			centerY - height / 2 >= context.canvas.height;

		if (outsideWindow) return;

		context.drawImage(
			this.image,
			SOURCE.x,
			SOURCE.y,
			SOURCE.width,
			SOURCE.height,
			centerX - width / 2,
			centerY - height / 2,
			width,
			height
		);
	}
}

export default Player;
