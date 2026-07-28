/*
 * Based on the popup logic from https://github.com/charliegerard/flappy-windows and  
 */
import { initialize } from "./initialize.js";
import WindowRepulsion, { OVERLAP } from "./WindowRepulsion.js";

const player = { x: 1, y: 1 };
const music = new Audio("./music.mp3");

let createdWindows = [];
let maze;
const windowRepulsion = new WindowRepulsion(OVERLAP);

music.loop = true;
music.volume = 0.5;

function getPiece(maze, windowData) {
	return maze.slice(windowData.start_x, windowData.end_x + 1).map((row) => row.slice(windowData.start_y, windowData.end_y + 1));
}

function createLayout(maze, windows) {
	const columns = Math.ceil(Math.sqrt(windows.length * screen.availWidth / screen.availHeight));
	const rows = Math.ceil(windows.length / columns);
	const slotWidth = screen.availWidth / columns;
	const slotHeight = screen.availHeight / rows;
	const frameWidth = window.outerWidth - window.innerWidth;
	const frameHeight = window.outerHeight - window.innerHeight;
	const pieces = windows.map((windowData) => ({
		windowData,
		piece: getPiece(maze, windowData)
	}));
	const maximumColumns = Math.max(...pieces.map(({ piece }) => piece[0].length));
	const maximumRows = Math.max(...pieces.map(({ piece }) => piece.length));
	const cellSize = Math.max(1, Math.floor(Math.min(
		screen.availWidth / maze[0].length,
		screen.availHeight / maze.length,
		(slotWidth - frameWidth) / maximumColumns,
		(slotHeight - frameHeight) / maximumRows
	)));
	const screenLeft = screen.availLeft || 0;
	const screenTop = screen.availTop || 0;

	return pieces.map(({ windowData, piece }, index) => {
		const width = piece[0].length * cellSize;
		const height = piece.length * cellSize;
		const slotLeft = screenLeft + index % columns * slotWidth;
		const slotTop = screenTop + Math.floor(index / columns) * slotHeight;
		const left = slotLeft + Math.random() * (slotWidth - width - frameWidth);
		const top = slotTop + Math.random() * (slotHeight - height - frameHeight);

		return {
			windowData,
			piece,
			cellSize,
			width,
			height,
			left: Math.round(left),
			top: Math.round(top)
		};
	});
}

function createWindow({ windowData, piece, cellSize, width, height, left, top }) {
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

	createdWindows.push({...windowData, popup, piece, cellSize, width, height, left, top});
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

	for (const windowLayout of createLayout(maze, windows)) createWindow(windowLayout);

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
		item.popup.postMessage({
			type: "player", player},
			window.location.origin
		);
	}
}

function closeGame() {
	windowRepulsion.reset();
	createdWindows = [];
}

window.addEventListener("message", (event) => {
	if (event.data.type === "window-restored") {
		windowRepulsion.syncWindow(event.source, event.data);
	}

	if (event.data.type === "ready") {
		const currentWindow = createdWindows.find((item) => item.popup === event.source);
		const { piece, start_x, start_y, cellSize, width, height } = currentWindow;

		event.source.postMessage({type: "initialize", maze, piece, start_x, start_y, cellSize, width, height, player}, window.location.origin);
	}

	if (event.data.type === "move") {
		player.x = event.data.x;
		player.y = event.data.y;
		sendPlayer();
	}
});

const startButton = document.querySelector("#start-button");
const closeButton = document.querySelector("#close-button");
const volumeSlider = document.querySelector("#volume-slider");
startButton.addEventListener("click", startGame);
closeButton.addEventListener("click", closeGame);
volumeSlider.addEventListener("input", changeVolume);
