import Player from "./Player.js";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const playerCanvas = document.createElement("canvas");
const playerContext = playerCanvas.getContext("2d");
const player = new Player();

let piece;
let startX;
let startY;
let cellWidth;
let cellHeight;
let windowWidth;
let windowHeight;
let lastFrameTime = performance.now();
let windowX = window.screenX;
let windowY = window.screenY;

document.body.append(canvas, playerCanvas);
resizeCanvas();

window.addEventListener("resize", () => {
	if (!windowWidth) return;

	window.moveTo(windowX, windowY);
	window.resizeTo(windowWidth, windowHeight);
	resizeCanvas();
	drawPiece();
});

window.addEventListener("message", (event) => {
	const data = event.data;

	if (data.type === "initialize") {
		piece = data.piece;
		startX = data.start_x;
		startY = data.start_y;
		windowWidth = data.width + window.outerWidth - window.innerWidth;
		windowHeight = data.height + window.outerHeight - window.innerHeight;
		window.resizeTo(windowWidth, windowHeight);
		player.setMaze(data.maze);
		player.setPosition(data.player);
		resizeCanvas();
		drawPiece();
	}

	if (data.type === "player") {
		player.setPosition(data.player);
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

	cellWidth = canvas.width / piece[0].length;
	cellHeight = canvas.height / piece.length;
	context.fillStyle = "#ffffff";
	context.strokeStyle = "#ff0000";
	context.lineWidth = 3;

	for (let x = 0; x < piece.length; x += 1) {
		for (let y = 0; y < piece[x].length; y += 1) {
			if (piece[x][y] !== 0) continue;

			const left = y * cellWidth;
			const top = x * cellHeight;
			const padding = Math.min(cellWidth, cellHeight) * 0.18;

			context.fillRect(left, top, cellWidth, cellHeight);
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

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;

	if (
		window.outerWidth === windowWidth &&
		window.outerHeight === windowHeight
	) {
		windowX = window.screenX;
		windowY = window.screenY;
	}

	player.update(deltaTime);

	playerContext.clearRect(
		0,
		0,
		playerCanvas.width,
		playerCanvas.height
	);

	if (piece) {
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
