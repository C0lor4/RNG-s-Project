const SPEED = 2;
const SIZE = 0.7;
const SOURCE = {
	x: 11,
	y: 18,
	width: 69,
	height: 156
};
const HITBOX_WIDTH = 0.4;
const HITBOX_HEIGHT = 0.8;

class Player {
	constructor() {
		this.x = 1;
		this.y = 1;
		this.keys = new Set();
		this.image = new Image();
		this.image.src = "./Player.png";

		window.addEventListener("keydown", (event) => {
			const key = event.key.toLowerCase();

			if (["w", "a", "s", "d"].includes(key)) {
				this.keys.add(key);
			}
		});

		window.addEventListener("keyup", (event) => {
			this.keys.delete(event.key.toLowerCase());
		});

		window.addEventListener("blur", () => {
			this.keys.clear();
		});
	}

	setPosition(position) {
		this.x = position.x;
		this.y = position.y;
	}

	update(deltaTime) {
		let x = Number(this.keys.has("s")) - Number(this.keys.has("w"));
		let y = Number(this.keys.has("d")) - Number(this.keys.has("a"));

		if (x === 0 && y === 0) return;

		const length = Math.hypot(x, y);
		x = x / length * SPEED * deltaTime;
		y = y / length * SPEED * deltaTime;

		this.x += x;
		this.y += y;

		window.opener.postMessage(
			{ type: "move", x: this.x, y: this.y },
			window.location.origin
		);
	}

	draw(context, startX, startY, cellWidth, cellHeight) {
		if (
			!this.image.complete ||
			this.image.naturalWidth === 0
		) {
			return;
		}

		const maximumWidth = cellWidth * SIZE;
		const maximumHeight = cellHeight * SIZE;
		const scale = Math.min(
			maximumWidth / SOURCE.width,
			maximumHeight / SOURCE.height
		);
		const width = SOURCE.width * scale;
		const height = SOURCE.height * scale;
		const centerX = (this.y - startY + 0.5) * cellWidth;
		const centerY = (this.x - startX + 0.5) * cellHeight;
		const hitboxWidth = width * HITBOX_WIDTH;
		const hitboxHeight = height * HITBOX_HEIGHT;

		const hitboxOutsideWindow =
			centerX + hitboxWidth / 2 <= 0 ||
			centerX - hitboxWidth / 2 >= context.canvas.width ||
			centerY + hitboxHeight / 2 <= 0 ||
			centerY - hitboxHeight / 2 >= context.canvas.height;

		if (hitboxOutsideWindow) return;

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
