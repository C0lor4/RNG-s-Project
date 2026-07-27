import { initialize } from "./initialize.js";
import WindowRepulsion from "./WindowRepulsion.js";

const CELL_SIZE = 100;
const OVERLAP = 16;
const player = { x: 1, y: 1 };

let createdWindows = [];
const windowRepulsion = new WindowRepulsion(OVERLAP);

function getPiece(maze, windowData) {
	return maze
		.slice(windowData.start_x, windowData.end_x + 1)
		.map((row) => row.slice(windowData.start_y, windowData.end_y + 1));
}

function createWindow(windowData, piece) {
	const width = piece[0].length * CELL_SIZE;
	const height = piece.length * CELL_SIZE;
	const position = findRandomPosition(width, height);
	const left = position.left;
	const top = position.top;
	const gameUrl = new URL("./game.html", window.location.href);
	gameUrl.searchParams.set("pieceId", windowData.id);

	const popup = window.open(
		gameUrl.href,
		`${windowData.id}-${Date.now()}`,
		[
			"popup=yes",
			`height=${height}`,
			`width=${width}`,
			`left=${left}`,
			`top=${top}`
		].join(",")
	);

	createdWindows.push({
		...windowData,
		popup,
		piece,
		width,
		height,
		left,
		top
	});

	windowRepulsion.addWindow(popup, windowData.id);
}

function findRandomPosition(width, height) {
	const screenLeft = screen.availLeft || 0;
	const screenTop = screen.availTop || 0;
	const maximumLeft = screenLeft + screen.availWidth - width;
	const maximumTop = screenTop + screen.availHeight - height;

	for (let attempt = 0; attempt < 100; attempt += 1) {
		const position = {
			left: randomInteger(screenLeft, maximumLeft),
			top: randomInteger(screenTop, maximumTop),
			width,
			height
		};

		if (!createdWindows.some((other) => windowsOverlap(position, other))) {
			return position;
		}
	}

	for (let top = screenTop; top <= maximumTop; top += 10) {
		for (let left = screenLeft; left <= maximumLeft; left += 10) {
			const position = { left, top, width, height };

			if (!createdWindows.some((other) => windowsOverlap(position, other))) {
				return position;
			}
		}
	}

	return { left: screenLeft, top: screenTop };
}

function windowsOverlap(first, second) {
	return (
		first.left < second.left + second.width - OVERLAP &&
		first.left + first.width - OVERLAP > second.left &&
		first.top < second.top + second.height - OVERLAP &&
		first.top + first.height - OVERLAP > second.top
	);
}

function randomInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function startGame() {
	const data = initialize();
	const maze = data[0];
	const windows = data.slice(1);

	createdWindows = [];

	for (const windowData of windows) {
		const piece = getPiece(maze, windowData);
		createWindow(windowData, piece);
	}

	createdWindows[0].popup.focus();
}

window.addEventListener("message", (event) => {
	if (event.data.type === "ready") {
		const currentWindow = createdWindows.find(
			(item) => item.popup === event.source
		);

		event.source.postMessage(
			{
				type: "initialize",
				piece: currentWindow.piece,
				start_x: currentWindow.start_x,
				start_y: currentWindow.start_y,
				player
			},
			window.location.origin
		);
	}

	if (event.data.type === "move") {
		player.x = event.data.x;
		player.y = event.data.y;

		for (const item of createdWindows) {
			item.popup.postMessage(
				{ type: "player", player },
				window.location.origin
			);
		}
	}
});

const startButton = document.querySelector("#start-button");
startButton.addEventListener("click", startGame);
