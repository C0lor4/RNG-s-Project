import { initialize } from "./initialize.js";
import WindowRepulsion from "./WindowRepulsion.js";

/**
 * Setup the windows
*/

const OVERLAP = 16;
let createdWindows = [];
let player = { x: 0, y: 0 };
const windowRepulsion = new WindowRepulsion(OVERLAP);

export function createWindows(height, width) {
	const index = createdWindows.length;
	const id = `piece-${index + 1}`;
	const position = findRandomPosition(height, width);
	const x = position.x;
	const y = position.y;
	const windowName = `${id}-${Date.now()}`;
	const gameUrl = new URL("./game.html", window.location.href);
	gameUrl.searchParams.set("pieceId", id);

	const popup = window.open(
		gameUrl.href,
		windowName,
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
		popup,
		height,
		width,
		x,
		y
	};

	createdWindows.push(windowInformation);
	windowRepulsion.addWindow(popup, id);
	return windowInformation;
}

function findRandomPosition(height, width) {
	const screenLeft = screen.availLeft || 0;
	const screenTop = screen.availTop || 0;
	const maximumX = screenLeft + screen.availWidth - width;
	const maximumY = screenTop + screen.availHeight - height;

	for (let attempt = 0; attempt < 100; attempt += 1) {
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

	for (let y = screenTop; y <= maximumY; y += 10) {
		for (let x = screenLeft; x <= maximumX; x += 10) {
			const position = { x, y, width, height };

			if (!createdWindows.some((other) => windowsOverlap(position, other))) {
				return position;
			}
		}
	}

	return { x: screenLeft, y: screenTop, width, height };
}

function windowsOverlap(first, second) {
	return (
		first.x < second.x + second.width - OVERLAP &&
		first.x + first.width - OVERLAP > second.x &&
		first.y < second.y + second.height - OVERLAP &&
		first.y + first.height - OVERLAP > second.y
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

	const firstWindow = createdWindows[0];
	player.x = firstWindow.x + firstWindow.width / 2;
	player.y = firstWindow.y + firstWindow.height / 2;
	sendPlayer();
}

function sendPlayer(oneWindow) {
	const windows = oneWindow
		? [{ popup: oneWindow }]
		: createdWindows;

	for (const item of windows) {
		if (!item.popup.closed) {
			item.popup.postMessage(
				{ type: "player", player },
				window.location.origin
			);
		}
	}
}

window.addEventListener("message", (event) => {
	if (event.data.type === "ready") {
		sendPlayer(event.source);
	}

	if (event.data.type === "move") {
		player.x += event.data.x;
		player.y += event.data.y;
		sendPlayer();
	}

});

const startButton = document.querySelector("#start-button");
startButton.addEventListener("click", startGame);
