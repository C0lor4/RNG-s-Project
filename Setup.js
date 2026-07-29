/*
 * Based on the popup logic from https://github.com/charliegerard/flappy-windows and  
 */
import {initialize} from "./initialize.js";
import WindowRepulsion, {OVERLAP} from "./WindowRepulsion.js";

const player = {x: 1, y: 1};
const music = new Audio("./music.mp3");
const MIN_POPUP_SIZE = 100; // 弹窗口最小限制
const mazeSizes = [{width: 33, height: 25}, {width: 41, height: 31}, {width: 49, height: 35}];
const pieceCounts = [8, 16, 20];

let createdWindows = [];
let maze;
let won = false;
let winWindow;
let mazeSizeIndex = 0;
let pieceCountIndex = 0;
const windowRepulsion = new WindowRepulsion(OVERLAP);

music.loop = true;
music.volume = 0.5;

function getPiece(maze, windowData) {
	return maze.slice(windowData.start_x, windowData.end_x + 1).map((row) => row.slice(windowData.start_y, windowData.end_y + 1));
}

function shufflePieces(pieces) {
	for (let index = pieces.length - 1; index > 0; index--) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[pieces[index], pieces[randomIndex]] = [pieces[randomIndex], pieces[index]];
	}
}

function createLayout(maze, windows) {
	const frameWidth = window.outerWidth - window.innerWidth;
	const frameHeight = window.outerHeight - window.innerHeight;
	const pieces = windows.map((windowData) => ({windowData, piece: getPiece(maze, windowData)}));
	const maximumColumns = Math.max(...pieces.map(({piece}) => piece[0].length));
	const maximumRows = Math.max(...pieces.map(({piece}) => piece.length));
	const mazeCellSize = Math.min(screen.availWidth / maze[0].length, screen.availHeight / maze.length);
	let layout = {
		columns: Math.ceil(Math.sqrt(windows.length)),
		cellSize: 1,
		emptySlots: Infinity
	};

	// 找layout的最优解
	for (let columns = 1; columns <= windows.length; columns++) {
		const rows = Math.ceil(windows.length / columns);
		const slotWidth = screen.availWidth / columns; // 屏幕弹窗的划分
		const slotHeight = screen.availHeight / rows;

		if (slotWidth < frameWidth + MIN_POPUP_SIZE || slotHeight < frameHeight + MIN_POPUP_SIZE) {
			continue;
		}
		// 网页内容宽度=位置宽度-浏览器边框宽度
		// 单格宽度=网页内容宽度÷最大区域列数
		const cellSize = Math.floor(Math.min(mazeCellSize, (slotWidth - frameWidth) / maximumColumns, (slotHeight - frameHeight) / maximumRows));
		const emptySlots = columns * rows - windows.length;

		// 最大化迷宫格子, 其次空位
		if (cellSize > layout.cellSize || cellSize === layout.cellSize && emptySlots < layout.emptySlots) {
			layout = {columns, cellSize, emptySlots};
		}
	}

	const rows = Math.ceil(windows.length / layout.columns);
	const slotWidth = screen.availWidth / layout.columns;
	const slotHeight = screen.availHeight / rows;
	const cellSize = Math.max(1, layout.cellSize);
	const screenLeft = screen.availLeft || 0;
	const screenTop = screen.availTop || 0;

	return pieces.map(({windowData, piece}, index) => {
		const width = Math.max(piece[0].length * cellSize, MIN_POPUP_SIZE);
		const height = Math.max(piece.length * cellSize, MIN_POPUP_SIZE);
		const popupWidth = width + frameWidth;
		const popupHeight = height + frameHeight;
		const slotLeft = screenLeft + index % layout.columns * slotWidth; // 弹窗区域
		const slotTop = screenTop + Math.floor(index / layout.columns) * slotHeight;
		const left = slotLeft + Math.max(0, slotWidth - popupWidth) / 2; // 弹窗第一个位置
		const top = slotTop + Math.max(0, slotHeight - popupHeight) / 2;

		return {windowData, piece, cellSize, width, height, left: Math.round(left), top: Math.round(top)};
	});
}

function createWindow({windowData, piece, cellSize, width, height, left, top}) {
	const gameUrl = new URL("./game.html", window.location.href);

	const popup = window.open(
		gameUrl.href,
		// `${windowData.id}-${Date.now()}`,// 避免用到重复的弹窗名
		`${windowData.id}`,
		`popup=yes,height=${height},width=${width},left=${left},top=${top}`
	);

	createdWindows.push({...windowData, popup, piece, cellSize, width, height, left, top});
	windowRepulsion.addWindow(popup, windowData.id, left, top);
}

function startGame() {
	closeGame();
	playMusic();
	player.x = 1;
	player.y = 1;
	won = false;

	const {width, height} = mazeSizes[mazeSizeIndex];
	const [newMaze, ...windows] = initialize(width, height, pieceCounts[pieceCountIndex]);
	maze = newMaze; // 更新全局 maze
	shufflePieces(windows);

	for (const windowLayout of createLayout(maze, windows)) createWindow(windowLayout);

	// 寻找 Player 然后 focus 那个弹窗
	const playerWindow = createdWindows.find((item) =>
		player.x >= item.start_x &&
		player.x <= item.end_x &&
		player.y >= item.start_y &&
		player.y <= item.end_y
	);
	playerWindow?.popup?.focus();
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
		item.popup.postMessage({type: "player", player}, window.location.origin);
	}
}

function closeGame() {
    windowRepulsion.reset();
    createdWindows = [];
    if (winWindow && !winWindow.closed) {winWindow.close();}
    winWindow = undefined;
}

function checkWin() {
	const goalX = maze.length - 2;
	const goalY = maze[0].length - 2;

	if (!won && Math.hypot(player.x - goalX, player.y - goalY) <= 0.5) {
		won = true;

		for (const item of createdWindows) {
			item.popup.postMessage({type: "win"}, window.location.origin);
		}

		const left = (screen.availLeft || 0) + (screen.availWidth - 500) / 2;
		const top = (screen.availTop || 0) + (screen.availHeight - 250) / 2;
		const winUrl = new URL("./win.html", window.location.href);

		winWindow = window.open(
			winUrl.href,
			"win-window",
			`popup=yes,width=${500},height=${250},left=${left},top=${top}`
		);
		winWindow?.focus();
	}
}

window.addEventListener("message", (event) => {
	// 告诉 WindowRepulsion 可以更新
	if (event.data.type === "window-restored") {
		windowRepulsion.syncWindow(event.source, event.data);
	}

	// Mac 的问题
	if (event.data.type === "ready") {
		const currentWindow = createdWindows.find((item) => item.popup === event.source);
		if (!currentWindow) return;

		const {piece, start_x, start_y, cellSize, width, height, left, top} = currentWindow;

		// main.js 会保存数据并开始游戏
		event.source.postMessage({type: "initialize", maze, piece, start_x, start_y, cellSize, width, height, left, top, player, won}, window.location.origin);
	}

	if (event.data.type === "move") {
		if (!createdWindows.some((item) => item.popup === event.source)) return;

		player.x = event.data.x;
		player.y = event.data.y;
		sendPlayer();
		checkWin();
	}
});

const startButton = document.querySelector("#start-button");
const closeButton = document.querySelector("#close-button");
const difficultyButton = document.querySelector("#difficulty-button");
const difficultyOptions = document.querySelector("#difficulty-options");
const mazeSizeButton = document.querySelector("#maze-size-button");
const pieceCountButton = document.querySelector("#piece-count-button");
const volumeSlider = document.querySelector("#volume-slider");
startButton.addEventListener("click", startGame);
closeButton.addEventListener("click", closeGame);
volumeSlider.addEventListener("input", changeVolume);

difficultyButton.addEventListener("click", () => {
	difficultyOptions.hidden = !difficultyOptions.hidden;
	difficultyButton.setAttribute("aria-expanded", String(!difficultyOptions.hidden));
});

mazeSizeButton.addEventListener("click", () => {
	mazeSizeIndex = (mazeSizeIndex + 1) % mazeSizes.length;
	const {width, height} = mazeSizes[mazeSizeIndex];
	mazeSizeButton.textContent = `${width}x${height}`;
});

pieceCountButton.addEventListener("click", () => {
	pieceCountIndex = (pieceCountIndex + 1) % pieceCounts.length;
	pieceCountButton.textContent = pieceCounts[pieceCountIndex];
});
