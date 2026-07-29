const SPEED = 5;
const SIZE = 0.9;
const ANIMATION_SPEED = 8;
const IDLE_ANIMATION_DELAY = 5000;
const MOVEMENT_KEYS = new Set(["w","a","s","d","arrowup","arrowleft","arrowdown","arrowright"]);

class Player {
	constructor() {
		this.x = 1;
		this.y = 1;
		this.maze = [];
		this.keys = new Set(); // 记录按键
		this.frame = 0;
		this.animationRow = 0;
		this.animationTime = 0;
		this.lastMovementTime = performance.now();
		this.movedRemotely = false;
		this.color = "#000000";
		this.image = new Image();
		this.image.src = "./Sprite.png";

		window.addEventListener("keydown", (event) => {
			const key = event.key.toLowerCase();

			if (MOVEMENT_KEYS.has(key)) {
				event.preventDefault(); // 阻止浏览器默认行为
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

	setColor(color) {
		this.color = color;
	}

	check(x, y) {
		const column = Math.floor(y + 0.5);
		return (this.maze[Math.floor(x + 0.5)]?.[column] === 1 && this.maze[Math.floor(x + SIZE / 2 + 0.5)]?.[column] === 1);
	}

	update(deltaTime) {
		const moveX = Number(this.keys.has("s") || this.keys.has("arrowdown")) - Number(this.keys.has("w") || this.keys.has("arrowup"));
		const moveY = Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft"));
		const length = Math.hypot(moveX, moveY);
		let moved = this.movedRemotely; // 切换弹窗
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

				window.opener.postMessage({type: "move", x: this.x, y: this.y}, window.location.origin);
			}
		}

		if (!moved) this.setAnimationRow(0, 0);

		if (!moved && performance.now() - this.lastMovementTime < IDLE_ANIMATION_DELAY) {
			this.animationTime = 0;
			this.frame = 0;
			return;
		}

		this.animationTime += deltaTime;
		this.frame = Math.floor(this.animationTime * ANIMATION_SPEED) % 5;
	}

	setAnimationRow(moveX, moveY) {
		let row = 0;

		if (moveX > 0) row = 1;
		else if (moveX < 0) row = 2;
		else if (moveY > 0) row = 3;
		else if (moveY < 0) row = 4;

		if (row !== this.animationRow) {
			this.animationRow = row;
			this.animationTime = 0;
			this.frame = 0;
		}
	}

	draw(context, startX, startY, cellSize, rows, columns) {
		if (!this.image.complete) return; // 以防万一等spirte 加载后在绘画

		const size = cellSize * SIZE;
		const centerX = (this.y - startY + 0.5) * cellSize;
		const centerY = (this.x - startX + 0.5) * cellSize;
		const outsideWindow = centerX + size / 2 <= 0 || centerX - size / 2 >= columns * cellSize || centerY + size / 2 <= 0 || centerY - size / 2 >= rows * cellSize;

		if (outsideWindow) return;

		const left = centerX - size / 2;
		const top = centerY - size / 2;

		context.imageSmoothingEnabled = false;
		context.drawImage(this.image, this.frame * 32, this.animationRow * 32, 32, 32, left, top, size, size);
		context.save();
		context.globalCompositeOperation = "source-atop";
		context.fillStyle = this.color;
		context.fillRect(left, top, size, size);
		context.restore();
	}
}

export default Player;
