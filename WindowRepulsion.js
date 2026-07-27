const DEFAULT_ALLOWED_OVERLAP = 8;
const UPDATE_INTERVAL = 40;
const MAX_PUSH_PER_UPDATE = 8;
const PUSH_SMOOTHING = 0.35;

class WindowRepulsion {
	constructor(windowManager, allowedOverlap = DEFAULT_ALLOWED_OVERLAP) {
		this.windowManager = windowManager;
		this.allowedOverlap = allowedOverlap;
		this.lastUpdate = 0;
		this.pushX = 0;
		this.pushY = 0;
	}

	update(currentTime) {
		if (currentTime - this.lastUpdate < UPDATE_INTERVAL) return;
		this.lastUpdate = currentTime;

		const thisWindow = this.windowManager.getThisWindowData();
		const otherWindows = this.windowManager
			.getWindows()
			.filter((item) => item.id !== thisWindow.id);

		let totalPushX = 0;
		let totalPushY = 0;

		for (const otherWindow of otherWindows) {
			const push = this.getPushForce(
				thisWindow.shape,
				otherWindow.shape,
				thisWindow.id,
				otherWindow.id
			);

			totalPushX += push.x;
			totalPushY += push.y;
		}

		const targetPushX = clamp(
			totalPushX,
			-MAX_PUSH_PER_UPDATE,
			MAX_PUSH_PER_UPDATE
		);
		const targetPushY = clamp(
			totalPushY,
			-MAX_PUSH_PER_UPDATE,
			MAX_PUSH_PER_UPDATE
		);

		// Smooth changing forces, but stop immediately once there is no
		// collision so the windows do not coast past each other.
		this.pushX = targetPushX === 0
			? 0
			: this.pushX + (targetPushX - this.pushX) * PUSH_SMOOTHING;
		this.pushY = targetPushY === 0
			? 0
			: this.pushY + (targetPushY - this.pushY) * PUSH_SMOOTHING;

		if (this.pushX !== 0 || this.pushY !== 0) {
			window.moveBy(Math.round(this.pushX), Math.round(this.pushY));
		}
	}

	getPushForce(first, second, firstId, secondId) {
		const overlapX =
			Math.min(first.x + first.w, second.x + second.w) -
			Math.max(first.x, second.x);
		const overlapY =
			Math.min(first.y + first.h, second.y + second.h) -
			Math.max(first.y, second.y);

		if (
			overlapX <= this.allowedOverlap ||
			overlapY <= this.allowedOverlap
		) {
			return { x: 0, y: 0 };
		}

		const firstCenterX = first.x + first.w / 2;
		const firstCenterY = first.y + first.h / 2;
		const secondCenterX = second.x + second.w / 2;
		const secondCenterY = second.y + second.h / 2;

		// Push along the axis that needs the least movement to separate.
		if (overlapX < overlapY) {
			const overlapDepth = overlapX - this.allowedOverlap;
			const direction = getDirection(firstCenterX, secondCenterX, firstId, secondId);
			return { x: direction * calculateStrength(overlapDepth), y: 0 };
		}

		const overlapDepth = overlapY - this.allowedOverlap;
		const direction = getDirection(firstCenterY, secondCenterY, firstId, secondId);
		return { x: 0, y: direction * calculateStrength(overlapDepth) };
	}
}

function calculateStrength(overlapDepth) {
	// Spring-like response: gentle near the edge and progressively stronger
	// when one window is pushed deeply into another.
	const strength = 0.12 * overlapDepth + 0.006 * overlapDepth ** 2;
	return clamp(Math.ceil(strength), 1, MAX_PUSH_PER_UPDATE);
}

function getDirection(firstCenter, secondCenter, firstId, secondId) {
	if (firstCenter < secondCenter) return -1;
	if (firstCenter > secondCenter) return 1;

	// Stable tie-breaker for windows with exactly matching centers.
	return firstId < secondId ? -1 : 1;
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

export default WindowRepulsion;
