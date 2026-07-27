import Player from "./Player.js";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const playerCanvas = document.createElement("canvas");
const playerContext = playerCanvas.getContext("2d");
const windowWidth = window.outerWidth;
const windowHeight = window.outerHeight;
const player = new Player();

let piece;
let startX;
let startY;
let lastFrameTime = performance.now();

document.body.appendChild(canvas);
document.body.appendChild(playerCanvas);
resizeCanvas();

window.addEventListener("resize", () => {
	window.resizeTo(windowWidth, windowHeight);
	resizeCanvas();
	drawPiece();
});

window.addEventListener("message", (event) => {
	if (event.data.type === "initialize") {
		piece = event.data.piece;
		startX = event.data.start_x;
		startY = event.data.start_y;
		player.setPosition(event.data.player);
		drawPiece();
	}

	if (event.data.type === "player") {
		player.setPosition(event.data.player);
	}
});

window.opener.postMessage(
	{ type: "ready" },
	window.location.origin
);

requestAnimationFrame(render);

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	playerCanvas.width = window.innerWidth;
	playerCanvas.height = window.innerHeight;
}

function drawPiece() {
	context.fillStyle = "#808080";
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (!piece) return;

	const cellWidth = canvas.width / piece[0].length;
	const cellHeight = canvas.height / piece.length;

	for (let x = 0; x < piece.length; x += 1) {
		for (let y = 0; y < piece[x].length; y += 1) {
			if (piece[x][y] === 0) {
				const left = y * cellWidth;
				const top = x * cellHeight;
				const padding = Math.min(cellWidth, cellHeight) * 0.18;

				context.fillStyle = "#ffffff";
				context.fillRect(left, top, cellWidth, cellHeight);

				context.strokeStyle = "#ff0000";
				context.lineWidth = 3;
				context.strokeRect(left, top, cellWidth, cellHeight);

				context.beginPath();
				context.moveTo(left + padding, top + padding);
				context.lineTo(
					left + cellWidth - padding,
					top + cellHeight - padding
				);
				context.moveTo(left + cellWidth - padding, top + padding);
				context.lineTo(left + padding, top + cellHeight - padding);
				context.stroke();
			}
		}
	}

}

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;

	player.update(deltaTime);

	playerContext.clearRect(
		0,
		0,
		playerCanvas.width,
		playerCanvas.height
	);

	if (piece) {
		const cellWidth = canvas.width / piece[0].length;
		const cellHeight = canvas.height / piece.length;

		player.draw(
			playerContext,
			startX,
			startY,
			cellWidth,
			cellHeight
		);
	}

	requestAnimationFrame(render);
}
