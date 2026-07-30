const STORAGE_KEY = "sneaky-switch-settings";

export const DEFAULT_SETTINGS = Object.freeze({
	volume: 0.5,
	blockColor: 30,
	playerColor: 0,
	repulsionEnabled: false,
	speed: 5,
	mazeSizeIndex: 0,
	pieceCountIndex: 0
});

function numberInRange(value, minimum, maximum, fallback) {
	const number = Number(value);
	return Number.isFinite(number) && number >= minimum && number <= maximum
		? number
		: fallback;
}

export function loadSettings() {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (!saved || typeof saved !== "object") return {...DEFAULT_SETTINGS};

		return {
			volume: numberInRange(saved.volume, 0, 1, DEFAULT_SETTINGS.volume),
			blockColor: numberInRange(saved.blockColor, 0, 420, DEFAULT_SETTINGS.blockColor),
			playerColor: numberInRange(saved.playerColor, 0, 420, DEFAULT_SETTINGS.playerColor),
			repulsionEnabled: typeof saved.repulsionEnabled === "boolean"
				? saved.repulsionEnabled
				: DEFAULT_SETTINGS.repulsionEnabled,
			speed: [3, 5, 8].includes(saved.speed) ? saved.speed : DEFAULT_SETTINGS.speed,
			mazeSizeIndex: [0, 1, 2].includes(saved.mazeSizeIndex)
				? saved.mazeSizeIndex
				: DEFAULT_SETTINGS.mazeSizeIndex,
			pieceCountIndex: [0, 1, 2].includes(saved.pieceCountIndex)
				? saved.pieceCountIndex
				: DEFAULT_SETTINGS.pieceCountIndex
		};
	} catch {
		return {...DEFAULT_SETTINGS};
	}
}

export function saveSettings(settings) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// The game remains usable when browser storage is unavailable.
	}
}
