const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 260;

let canvas;
let context;
let player;
let lastFrameTime = performance.now();
let lockedWindowSize;
const keys = new Set();

window.addEventListener("load", init);

function init() {
	canvas = document.createElement("canvas");
	context = canvas.getContext("2d");
	document.body.appendChild(canvas);

	lockedWindowSize = {
		width: window.outerWidth,
		height: window.outerHeight
	};

	resize();
	addEventListeners();

	window.opener.postMessage(
		{ type: "ready" },
		window.location.origin
	);

	requestAnimationFrame(render);
}

function addEventListeners() {
	window.addEventListener("resize", lockWindowSize);

	window.addEventListener("keydown", (event) => {
		const key = event.key.toLowerCase();

		if (["w", "a", "s", "d"].includes(key)) {
			keys.add(key);
		}

		if (key === "r") {
			window.opener.postMessage(
				{
					type: "reset",
					x: window.screenX + window.innerWidth / 2,
					y: window.screenY + window.innerHeight / 2
				},
				window.location.origin
			);
		}
	});

	window.addEventListener("keyup", (event) => {
		keys.delete(event.key.toLowerCase());
	});

	window.addEventListener("blur", () => keys.clear());

	window.addEventListener("message", (event) => {
		if (event.data.type === "player") {
			player = event.data.player;
		}
	});
}

function lockWindowSize() {
	window.resizeTo(lockedWindowSize.width, lockedWindowSize.height);
	resize();
}

function resize() {
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	canvas.width = window.innerWidth * pixelRatio;
	canvas.height = window.innerHeight * pixelRatio;
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${window.innerHeight}px`;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function movePlayer(deltaTime) {
	let x = Number(keys.has("d")) - Number(keys.has("a"));
	let y = Number(keys.has("s")) - Number(keys.has("w"));

	if (x === 0 && y === 0) return;

	const length = Math.hypot(x, y);
	x = x / length * PLAYER_SPEED * deltaTime;
	y = y / length * PLAYER_SPEED * deltaTime;

	window.opener.postMessage(
		{ type: "move", x, y },
		window.location.origin
	);
}

function drawPlayer() {
	if (!player) return;

	const x = player.x - window.screenX;
	const y = player.y - window.screenY;

	context.beginPath();
	context.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
	context.fillStyle = "#8be9fd";
	context.fill();
}

function drawInstructions() {
	context.fillStyle = "rgba(255, 255, 255, 0.75)";
	context.font = "16px system-ui, sans-serif";
	context.fillText("Use WASD to move - R resets the dot", 20, 32);
}

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;

	movePlayer(deltaTime);

	context.fillStyle = "#070a12";
	context.fillRect(0, 0, window.innerWidth, window.innerHeight);
	drawInstructions();
	drawPlayer();

	requestAnimationFrame(render);
}
