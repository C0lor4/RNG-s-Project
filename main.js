import Player from "./player.js";

const SIZE_RETRY_INTERVAL = 100;
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const playerCanvas = document.createElement("canvas");
const playerContext = playerCanvas.getContext("2d");
const player = new Player();
const diamond = new Image();
diamond.src = "./diamond.png";
diamond.addEventListener("load", drawPiece);

let piece;
let maze;
let startX;
let startY;
let cellSize;
let windowWidth;
let windowHeight;
let lastFrameTime = performance.now();
let windowX = window.screenX;
let windowY = window.screenY;
let managedPosition;
let restoringSize = false;
let drag;
let diamondVisible = true;
let nextSizeRetry = 0;

document.body.append(canvas, playerCanvas);
resizeCanvas();

window.setManagedPosition = (left, top) => {
	windowX = left;
	windowY = top;
	managedPosition = { left, top };
};

window.addEventListener("resize", () => {
	if (!windowWidth || restoringSize) return;

	restoringSize = true;
	window.moveTo(windowX, windowY);
	window.resizeTo(windowWidth, windowHeight);

	requestAnimationFrame(() => {
		restoringSize = false;
		resizeCanvas();
		drawPiece();
		window.opener.postMessage({
			type: "window-restored",
			left: window.screenX,
			top: window.screenY,
			width: window.outerWidth,
			height: window.outerHeight
		}, window.location.origin);
	});
});

playerCanvas.addEventListener("pointerdown", (event) => {
	if (event.button !== 0) return;

	drag = {
		x: event.screenX,
		y: event.screenY,
		left: window.screenX,
		top: window.screenY,
		targetLeft: window.screenX,
		targetTop: window.screenY
	};
	playerCanvas.setPointerCapture(event.pointerId);
});

playerCanvas.addEventListener("pointermove", (event) => {
	if (!drag) return;

	drag.targetLeft = drag.left + event.screenX - drag.x;
	drag.targetTop = drag.top + event.screenY - drag.y;
});

playerCanvas.addEventListener("pointerup", stopDragging);
playerCanvas.addEventListener("pointercancel", stopDragging);

function stopDragging(event) {
	if (!drag) return;

	moveDraggedWindow();
	drag = undefined;
	if (playerCanvas.hasPointerCapture(event.pointerId)) {
		playerCanvas.releasePointerCapture(event.pointerId);
	}
}

function moveDraggedWindow() {
	if (!drag) return;

	const left = Math.round(drag.targetLeft);
	const top = Math.round(drag.targetTop);

	if (Math.hypot(window.screenX - left, window.screenY - top) <= 1) return;

	windowX = left;
	windowY = top;
	managedPosition = undefined;
	window.moveTo(left, top);
}

window.addEventListener("message", (event) => {
	const data = event.data;

	if (data.type === "initialize") {
		piece = data.piece;
		maze = data.maze;
		startX = data.start_x;
		startY = data.start_y;
		cellSize = data.cellSize;
		window.setManagedPosition(data.left, data.top);
		window.moveTo(data.left, data.top);
		windowWidth = data.width + window.outerWidth - window.innerWidth;
		windowHeight = data.height + window.outerHeight - window.innerHeight;
		nextSizeRetry = 0;
		window.resizeTo(windowWidth, windowHeight);
		player.setMaze(data.maze);
		player.setPosition(data.player);
		diamondVisible = !data.won;
		resizeCanvas();
		drawPiece();
	}

	if (data.type === "player") {
		player.setPosition(data.player);
	}

	if (data.type === "win") {
		diamondVisible = false;
		drawPiece();
	}
});

function sendReady() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			window.opener.postMessage(
				{ type: "ready" },
				window.location.origin
			);
		});
	});
}

if (document.readyState === "complete") {
	sendReady();
} else {
	window.addEventListener("load", sendReady, { once: true });
}

window.setInterval(() => {
	if (!window.opener || window.opener.closed) window.close();
}, 250);

requestAnimationFrame(render);

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	playerCanvas.width = window.innerWidth;
	playerCanvas.height = window.innerHeight;
}

function drawPiece() {
	context.fillStyle = "#000000";
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (!piece) return;

	const rows = piece.length;
	const columns = piece[0].length;
	context.fillStyle = "#808080";
	context.fillRect(0, 0, columns * cellSize, rows * cellSize);
	context.fillStyle = "#ffffff";
	context.strokeStyle = "#ff0000";
	context.lineWidth = 3;

	for (let x = 0; x < rows; x += 1) {
		for (let y = 0; y < columns; y += 1) {
			if (piece[x][y] !== 0) continue;

			const left = y * cellSize;
			const top = x * cellSize;
			const padding = cellSize * 0.18;

			context.fillRect(left, top, cellSize, cellSize);
			context.strokeRect(left, top, cellSize, cellSize);

			context.beginPath();
			context.moveTo(left + padding, top + padding);
			context.lineTo(
				left + cellSize - padding,
				top + cellSize - padding
			);
			context.moveTo(left + cellSize - padding, top + padding);
			context.lineTo(left + padding, top + cellSize - padding);
			context.stroke();
		}
	}

	context.beginPath();

	for (let x = 0; x < rows; x += 1) {
		const top = x * cellSize;

		if (piece[x][0] === 1 && maze[startX + x]?.[startY - 1] === 0) {
			context.moveTo(0, top);
			context.lineTo(0, top + cellSize);
		}

		if (piece[x][columns - 1] === 1 && maze[startX + x]?.[startY + columns] === 0) {
			context.moveTo(columns * cellSize, top);
			context.lineTo(columns * cellSize, top + cellSize);
		}
	}

	for (let y = 0; y < columns; y += 1) {
		const left = y * cellSize;

		if (piece[0][y] === 1 && maze[startX - 1]?.[startY + y] === 0) {
			context.moveTo(left, 0);
			context.lineTo(left + cellSize, 0);
		}

		if (piece[rows - 1][y] === 1 && maze[startX + rows]?.[startY + y] === 0) {
			context.moveTo(left, rows * cellSize);
			context.lineTo(left + cellSize, rows * cellSize);
		}
	}

	context.stroke();

	const goalX = maze.length - 2;
	const goalY = maze[0].length - 2;
	const localX = goalX - startX;
	const localY = goalY - startY;

	if (
		diamondVisible &&
		diamond.complete &&
		diamond.naturalWidth &&
		localX >= 0 &&
		localX < rows &&
		localY >= 0 &&
		localY < columns
	) {
		const size = cellSize * 0.7;
		const centerX = (localY + 0.5) * cellSize;
		const centerY = (localX + 0.5) * cellSize;

		context.imageSmoothingEnabled = false;
		context.drawImage(
			diamond,
			centerX - size / 2,
			centerY - size / 2,
			size,
			size
		);
	}
}

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;
	moveDraggedWindow();

	if (
		windowWidth &&
		!restoringSize &&
		currentTime >= nextSizeRetry &&
		(
			Math.abs(window.outerWidth - windowWidth) > 1 ||
			Math.abs(window.outerHeight - windowHeight) > 1
		)
	) {
		nextSizeRetry = currentTime + SIZE_RETRY_INTERVAL;
		window.resizeTo(windowWidth, windowHeight);
	}

	if (
		managedPosition &&
		Math.hypot(
			window.screenX - managedPosition.left,
			window.screenY - managedPosition.top
		) <= 1
	) {
		windowX = window.screenX;
		windowY = window.screenY;
		managedPosition = undefined;
	} else if (
		!managedPosition &&
		window.outerWidth === windowWidth &&
		window.outerHeight === windowHeight
	) {
		windowX = window.screenX;
		windowY = window.screenY;
	}

	player.update(deltaTime);

	if (!drag) {
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
				cellSize,
				piece.length,
				piece[0].length
			);
		}
	}

	requestAnimationFrame(render);
}
