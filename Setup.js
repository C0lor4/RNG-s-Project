import { initialize } from "./initialize.js";

/**
 * Setup the windows
*/

const LAYOUT_STORAGE_KEY = "window-maze-layout";
const WINDOW_GAP = 20;
let createdWindows = [];

export function createWindows(height, width) {
	const index = createdWindows.length;
	const id = `piece-${index + 1}`;
	const position = findRandomPosition(height, width);
	const x = position.x;
	const y = position.y;

	const popup = window.open(
		`./game.html?pieceId=${id}`,
		id,
		[
			"popup=yes",
			`height=${height}`,
			`width=${width}`,
			`left=${x}`,
			`top=${y}`
		].join(",")
	);

	const windowInformation = {
		id,
		height,
		width,
		x,
		y,
		opened: popup !== null
	};

	createdWindows.push(windowInformation);
	return windowInformation;
}

function findRandomPosition(height, width) {
	const screenLeft = screen.availLeft || 0;
	const screenTop = screen.availTop || 0;
	const maximumX = screenLeft + screen.availWidth - width;
	const maximumY = screenTop + screen.availHeight - height;

	while (true) {
		const position = {
			x: randomInteger(screenLeft, maximumX),
			y: randomInteger(screenTop, maximumY),
			width,
			height
		};

		if (!createdWindows.some((other) => windowsOverlap(position, other))) {
			return position;
		}
	}
}

function windowsOverlap(first, second) {
	return (
		first.x < second.x + second.width + WINDOW_GAP &&
		first.x + first.width + WINDOW_GAP > second.x &&
		first.y < second.y + second.height + WINDOW_GAP &&
		first.y + first.height + WINDOW_GAP > second.y
	);
}

function randomInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function startGame() {
	const pieces = initialize();
	createdWindows = [];

	for (const piece of pieces) {
		createWindows(piece.height, piece.width);
	}

	localStorage.setItem(
		LAYOUT_STORAGE_KEY,
		JSON.stringify({
			pieces,
			windows: createdWindows
		})
	);
}

const startButton = document.querySelector("#start-button");
startButton.addEventListener("click", startGame);
