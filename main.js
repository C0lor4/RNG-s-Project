import WindowManager from "./WindowManager.js";
import WindowRepulsion from "./WindowRepulsion.js";

const PLAYER_KEY = "window-maze-player";
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 260;

let canvas;
let context;
let windowManager;
let windowRepulsion;
let player;
let lastFrameTime = performance.now();
let initialized = false;
let lockedWindowSize;
const keys = new Set();

if (new URLSearchParams(window.location.search).has("clear")) {
	localStorage.clear();
	history.replaceState({}, "", window.location.pathname);
}

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState !== "hidden") init();
});

window.addEventListener("load", init);

function init() {
	if (initialized || document.visibilityState === "hidden") return;
	initialized = true;

	canvas = document.createElement("canvas");
	canvas.id = "scene";
	context = canvas.getContext("2d");
	document.body.appendChild(canvas);

	windowManager = new WindowManager();
	windowManager.init({ role: "maze-fragment" });
	windowRepulsion = new WindowRepulsion(windowManager, 8);

	lockedWindowSize = {
		width: window.outerWidth,
		height: window.outerHeight
	};

	resize();
	loadOrCreatePlayer();
	addEventListeners();
	requestAnimationFrame(render);
}

function loadOrCreatePlayer() {
	const savedPlayer = readPlayer();

	// The first window places the player visibly in its center.
	player = savedPlayer || {
		x: window.screenX + window.innerWidth / 2,
		y: window.screenY + window.innerHeight / 2
	};

	savePlayer();
}

function readPlayer() {
	try {
		return JSON.parse(localStorage.getItem(PLAYER_KEY));
	} catch {
		return null;
	}
}

function savePlayer() {
	localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

function addEventListeners() {
	window.addEventListener("resize", lockWindowSize);

	window.addEventListener("keydown", (event) => {
		const key = event.key.toLowerCase();
		if (["w", "a", "s", "d"].includes(key)) {
			event.preventDefault();
			keys.add(key);
		}

		if (key === "r") {
			player.x = window.screenX + window.innerWidth / 2;
			player.y = window.screenY + window.innerHeight / 2;
			savePlayer();
		}
	});

	window.addEventListener("keyup", (event) => {
		keys.delete(event.key.toLowerCase());
	});

	window.addEventListener("blur", () => keys.clear());

	// A storage event fires in every other window when the active window moves.
	window.addEventListener("storage", (event) => {
		if (event.key === PLAYER_KEY && event.newValue) {
			try {
				player = JSON.parse(event.newValue);
			} catch {
				// Ignore an incomplete storage update.
			}
		}
	});
}

function lockWindowSize() {
	// resizeTo generally works only for windows created with window.open().
	window.resizeTo(lockedWindowSize.width, lockedWindowSize.height);
	resize();
}

function resize() {
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	canvas.width = Math.round(window.innerWidth * pixelRatio);
	canvas.height = Math.round(window.innerHeight * pixelRatio);
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${window.innerHeight}px`;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function updatePlayer(deltaTime) {
	let horizontal = Number(keys.has("d")) - Number(keys.has("a"));
	let vertical = Number(keys.has("s")) - Number(keys.has("w"));

	if (horizontal === 0 && vertical === 0) return;

	const length = Math.hypot(horizontal, vertical);
	horizontal /= length;
	vertical /= length;

	player.x += horizontal * PLAYER_SPEED * deltaTime;
	player.y += vertical * PLAYER_SPEED * deltaTime;
	savePlayer();
}

function drawPlayer() {
	// Convert the shared desktop position into this window's canvas position.
	const localX = player.x - window.screenX;
	const localY = player.y - window.screenY;

	context.beginPath();
	context.arc(localX, localY, PLAYER_RADIUS * 1.8, 0, Math.PI * 2);
	context.fillStyle = "rgba(53, 217, 255, 0.2)";
	context.fill();

	context.beginPath();
	context.arc(localX, localY, PLAYER_RADIUS, 0, Math.PI * 2);
	context.fillStyle = "#8be9fd";
	context.fill();

	context.beginPath();
	context.arc(localX - 4, localY - 5, 3, 0, Math.PI * 2);
	context.fillStyle = "#ffffff";
	context.fill();
}

function drawInstructions() {
	context.fillStyle = "rgba(255, 255, 255, 0.75)";
	context.font = "16px system-ui, sans-serif";
	context.fillText("Click, then use WASD to move • R resets the dot", 20, 32);
}

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;

	windowManager.update();
	windowRepulsion.update(currentTime);
	updatePlayer(deltaTime);

	context.fillStyle = "#070a12";
	context.fillRect(0, 0, window.innerWidth, window.innerHeight);
	drawInstructions();
	drawPlayer();

	requestAnimationFrame(render);
}
