/*
 * Based on the popup logic from https://github.com/charliegerard/flappy-windows and  
 */
import {initialize} from "./initialize.js";
import WindowRepulsion, {OVERLAP} from "./WindowRepulsion.js";

const player = {x: 1, y: 1};
const music = document.querySelector("#music");
const MIN_POPUP_SIZE = 100; // 弹窗口最小限制
const mazeSizes = [{width: 33, height: 25}, {width: 41, height: 31}, {width: 49, height: 35}];
const pieceCounts = [8, 16, 20];
const colors = {block: 30, player: 0};
const CHEST_ANIMATION_DURATION = 1000;

let createdWindows = [];
let maze;
let won = false;
let winWindow;
let settingsWindow;
let keyPosition;
let hasKey = false;
let chestOpenedAt = 0;
let winTimer;
let playerSpeed = 5;
let mazeSizeIndex = 0;
let pieceCountIndex = 0;
const windowRepulsion = new WindowRepulsion(OVERLAP);

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

// 随机放置钥匙
function placeKey(maze) {
	const paths = [];
	const goalX = maze.length - 2;
	const goalY = maze[0].length - 2;

	for (let x = 0; x < maze.length; x += 1) {
		for (let y = 0; y < maze[x].length; y += 1) {
			if (maze[x][y] === 1 && (x !== 1 || y !== 1) && (x !== goalX || y !== goalY)) {
				paths.push({x, y});
			}
		}
	}

	return paths[Math.floor(Math.random() * paths.length)];
}

function startGame() {
	closeGame();
	playMusic();
	player.x = 1;
	player.y = 1;
	won = false;
	hasKey = false;
	chestOpenedAt = 0;

	const {width, height} = mazeSizes[mazeSizeIndex];
	const [newMaze, ...windows] = initialize(width, height, pieceCounts[pieceCountIndex]);
	maze = newMaze; // 更新全局 maze
	keyPosition = placeKey(maze);
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

function changeVolume(value) {
	music.volume = Number(value);

	if (music.volume === 0) {
		music.pause();
	} else if (music.paused) {
		playMusic();
	}
}

function getColor(value) {
	if (value < 30) return `hsl(0 100% ${value / 30 * 50}%)`;
	if (value <= 390) return `hsl(${value - 30} 100% 50%)`;

	const white = (value - 390) / 30;
	return `hsl(0 ${100 - white * 100}% ${50 + white * 50}%)`;
}

function getColors() {
	return {
		blockColor: getColor(colors.block),
		playerColor: getColor(colors.player)
	};
}

function sendColors() {
	const message = {type: "colors", ...getColors()};

	for (const item of createdWindows) {
		item.popup.postMessage(message, window.location.origin);
	}
}

function sendSpeed() {
	for (const item of createdWindows) {
		item.popup.postMessage({
			type: "speed",
			speed: playerSpeed
		}, window.location.origin);
	}
}

function openSettings() {
	if (settingsWindow && !settingsWindow.closed) {
		settingsWindow.focus();
		return;
	}

	const width = 760;
	const height = 420;
	const left = (screen.availLeft || 0) + (screen.availWidth - width) / 2;
	const top = (screen.availTop || 0) + (screen.availHeight - height) / 2;
	const settingsUrl = new URL("./settings.html", window.location.href);

	settingsWindow = window.open(
		settingsUrl.href,
		"settings-window",
		`popup=yes,width=${width},height=${height},left=${left},top=${top}`
	);
	settingsWindow?.focus();
}

function sendPlayer() {
	for (const item of createdWindows) {
		item.popup.postMessage({type: "player", player}, window.location.origin);
	}
}

function closeGame() {
	clearTimeout(winTimer);
	windowRepulsion.reset();
	createdWindows = [];
	if (winWindow && !winWindow.closed) winWindow.close();
	winWindow = undefined;
}

function closeAllWindows() {
	closeGame();
	if (settingsWindow && !settingsWindow.closed) settingsWindow.close();
	settingsWindow = undefined;
}

function checkKey() {
	if (!hasKey && Math.hypot(player.x - keyPosition.x, player.y - keyPosition.y) <= 0.5) {
		hasKey = true;

		for (const item of createdWindows) {
			item.popup.postMessage({type: "key-collected"}, window.location.origin);
		}
	}
}

function checkWin() {
	const goalX = maze.length - 2;
	const goalY = maze[0].length - 2;

	if (hasKey && !won && !chestOpenedAt && Math.hypot(player.x - goalX, player.y - goalY) <= 0.5) {
		chestOpenedAt = Date.now();

		for (const item of createdWindows) {
			item.popup.postMessage({
				type: "open-chest",
				startedAt: chestOpenedAt
			}, window.location.origin);
		}

		winTimer = setTimeout(showWin, CHEST_ANIMATION_DURATION);
	}
}

function showWin() {
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

window.addEventListener("message", (event) => {
	if (event.origin !== window.location.origin) return;

	if (event.source === settingsWindow) {
		if (event.data.type === "settings-ready") {
			event.source.postMessage({
				type: "settings-state",
				volume: music.volume,
				repulsionEnabled: windowRepulsion.enabled,
				speed: playerSpeed,
				...colors
			}, window.location.origin);
		}

		if (event.data.type === "settings-volume") {
			changeVolume(event.data.value);
		}

		if (event.data.type === "settings-repulsion") {
			windowRepulsion.setEnabled(event.data.enabled);
		}

		if (event.data.type === "settings-color") {
			colors[event.data.name] = event.data.value;
			sendColors();
		}

		if (event.data.type === "settings-speed") {
			playerSpeed = event.data.speed;
			sendSpeed();
		}

		return;
	}

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
		event.source.postMessage({
			type: "initialize",
			maze,
			piece,
			start_x,
			start_y,
			cellSize,
			width,
			height,
			left,
			top,
			player,
			won,
			keyPosition,
			hasKey,
			chestOpenedAt,
			speed: playerSpeed,
			...getColors()
		}, window.location.origin);
	}

	if (event.data.type === "move") {
		if (!createdWindows.some((item) => item.popup === event.source)) return;

		player.x = event.data.x;
		player.y = event.data.y;
		sendPlayer();
		checkKey();
		checkWin();
	}
});

const startButton = document.querySelector("#start-button");
const closeButton = document.querySelector("#close-button");
const settingsButton = document.querySelector("#settings-button");
const difficultyButton = document.querySelector("#difficulty-button");
const difficultyOptions = document.querySelector("#difficulty-options");
const mazeSizeButton = document.querySelector("#maze-size-button");
const pieceCountButton = document.querySelector("#piece-count-button");
startButton.addEventListener("click", startGame);
closeButton.addEventListener("click", closeAllWindows);
settingsButton.addEventListener("click", openSettings);

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
