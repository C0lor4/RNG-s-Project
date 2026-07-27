const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 260;

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const keys = new Set();
const windowWidth = window.outerWidth;
const windowHeight = window.outerHeight;

let player;
let lastFrameTime = performance.now();

document.body.appendChild(canvas);
resizeCanvas();

window.addEventListener("resize", () => {
	window.resizeTo(windowWidth, windowHeight);
	resizeCanvas();
});

window.addEventListener("keydown", (event) => {
	const key = event.key.toLowerCase();

	if (["w", "a", "s", "d"].includes(key)) {
		keys.add(key);
	}
});

window.addEventListener("keyup", (event) => {
	keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
	keys.clear();
});

window.addEventListener("message", (event) => {
	if (event.data.type === "player") {
		player = event.data.player;
	}
});

window.opener.postMessage(
	{ type: "ready" },
	window.location.origin
);

requestAnimationFrame(render);

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
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

function render(currentTime) {
	const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
	lastFrameTime = currentTime;

	movePlayer(deltaTime);

	context.fillStyle = "#070a12";
	context.fillRect(0, 0, canvas.width, canvas.height);
	drawPlayer();

	requestAnimationFrame(render);
}
