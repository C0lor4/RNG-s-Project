import { initialize } from "./initialize.js";
import WindowRepulsion, {
	OVERLAP,
	findFreePosition
} from "./WindowRepulsion.js";

const CELL_SIZE = 100;
const player = { x: 1, y: 1 };
const music = new Audio("./music.mp3");

let createdWindows = [];
let maze;
const windowRepulsion = new WindowRepulsion(OVERLAP);

music.loop = true;
music.volume = 0.5;

function getPiece(maze, windowData) {
	return maze
		.slice(windowData.start_x, windowData.end_x + 1)
		.map((row) =>
			row.slice(windowData.start_y, windowData.end_y + 1)
		);
}

function createWindow(windowData, piece) {
	const width = piece[0].length * CELL_SIZE;
	const height = piece.length * CELL_SIZE;
	const { left, top } = findFreePosition(
		width,
		height,
		createdWindows,
		OVERLAP
	);
	const gameUrl = new URL("./game.html", window.location.href);

	const features = [
		"popup=yes",
		`height=${height}`,
		`width=${width}`,
		`left=${left}`,
		`top=${top}`
	].join(",");
	const popup = window.open(
		gameUrl.href,
		`${windowData.id}-${Date.now()}`,
		features
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

function startGame() {
	playMusic();
	windowRepulsion.reset();
	createdWindows = [];
	player.x = 1;
	player.y = 1;

	const [newMaze, ...windows] = initialize();
	maze = newMaze;

	for (const windowData of windows) {
		const piece = getPiece(maze, windowData);
		createWindow(windowData, piece);
	}

	createdWindows[0].popup.focus();
}

function playMusic() {
	if (music.volume > 0) music.play().catch(() => {});
}

function changeVolume(event) {
	music.volume = Number(event.target.value);

	if (music.volume === 0) {
		music.pause();
	} else if (music.paused) {
		playMusic();
	}
}

function sendPlayer() {
	for (const item of createdWindows) {
		item.popup.postMessage(
			{ type: "player", player },
			window.location.origin
		);
	}
}

function resetGame() {
	if (createdWindows.length === 0) return;

	player.x = 1;
	player.y = 1;

	for (const item of createdWindows) {
		item.popup.moveTo(item.left, item.top);
		item.popup.focus();
	}

	sendPlayer();
	createdWindows[0].popup.focus();
}

window.addEventListener("message", (event) => {
	if (event.data.type === "ready") {
		const currentWindow = createdWindows.find(
			(item) => item.popup === event.source
		);
		const { piece, start_x, start_y, width, height } = currentWindow;

		event.source.postMessage(
			{
				type: "initialize",
				maze,
				piece,
				start_x,
				start_y,
				width,
				height,
				player
			},
			window.location.origin
		);
	}

	if (event.data.type === "move") {
		player.x = event.data.x;
		player.y = event.data.y;
		sendPlayer();
	}
});

const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");
const volumeSlider = document.querySelector("#volume-slider");
startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
volumeSlider.addEventListener("input", changeVolume);
