export const OVERLAP = 16;
const CORNER_DIFFERENCE = 16;
const RELEASE_DELAY = 140;
const UPDATE_INTERVAL = 20;

class WindowRepulsion {
	constructor(allowedOverlap = OVERLAP) {
		this.allowedOverlap = allowedOverlap;
		this.windows = [];
		window.setInterval(() => this.update(), UPDATE_INTERVAL);
	}

	addWindow(popup, id) {
		if (!popup) return;

		this.windows.push({
			id,
			popup,
			left: popup.screenX,
			top: popup.screenY,
			width: popup.outerWidth,
			height: popup.outerHeight,
			lastMovedAt: performance.now(),
			movement: 0,
			ignoreMovementUntil: 0
		});
	}

	reset() {
		for (const item of this.windows) {
			item.popup.close();
		}

		this.windows = [];
	}

	update() {
		const currentTime = performance.now();

		this.windows = this.windows.filter((item) => !item.popup.closed);

		for (const item of this.windows) {
			this.updateWindowInformation(item, currentTime);
		}

		for (
			let firstIndex = 0;
			firstIndex < this.windows.length;
			firstIndex += 1
		) {
			for (let secondIndex = firstIndex + 1; secondIndex < this.windows.length; secondIndex += 1) {
				this.resolveCollision(
					this.windows[firstIndex],
					this.windows[secondIndex],
					currentTime
				);
			}
		}
	}

	updateWindowInformation(item, currentTime) {
		const newLeft = item.popup.screenX;
		const newTop = item.popup.screenY;
		const movement = Math.hypot(newLeft - item.left, newTop - item.top);

		item.left = newLeft;
		item.top = newTop;
		item.width = item.popup.outerWidth;
		item.height = item.popup.outerHeight;
		item.movement =
			currentTime < item.ignoreMovementUntil ? 0 : movement;

		if (item.movement > 0) {
			item.lastMovedAt = currentTime;
		}
	}

	resolveCollision(first, second, currentTime) {
		const overlapX =
			Math.min(
				first.left + first.width,
				second.left + second.width
			) - Math.max(first.left, second.left);
		const overlapY =
			Math.min(
				first.top + first.height,
				second.top + second.height
			) - Math.max(first.top, second.top);

		if (overlapX <= this.allowedOverlap || overlapY <= this.allowedOverlap) return;

		const dragged = this.getDraggedWindow(first, second);
		const pushed = dragged === first ? second : first;
		const isCornerCollision = Math.abs(overlapX - overlapY) <= CORNER_DIFFERENCE;
		const dragHasStopped = currentTime - dragged.lastMovedAt >= RELEASE_DELAY;

		// Wait until a corner drag stops so the push direction cannot flicker.
		if (isCornerCollision && !dragHasStopped) return;

		if (isCornerCollision) {
			this.teleportWindow(pushed, currentTime);
		} else {
			this.pushWindow(dragged, pushed, overlapX, overlapY, currentTime);
		}
	}

	getDraggedWindow(first, second) {
		if (first.movement !== second.movement) {
			return first.movement > second.movement ? first : second;
		}

		if (first.lastMovedAt !== second.lastMovedAt) {
			return first.lastMovedAt > second.lastMovedAt ? first : second;
		}

		return first.id < second.id ? first : second;
	}

	pushWindow(dragged, pushed, overlapX, overlapY, currentTime) {
		const draggedCenterX = dragged.left + dragged.width / 2;
		const draggedCenterY = dragged.top + dragged.height / 2;
		const pushedCenterX = pushed.left + pushed.width / 2;
		const pushedCenterY = pushed.top + pushed.height / 2;
		let left = pushed.left;
		let top = pushed.top;

		if (overlapX < overlapY) {
			left = draggedCenterX < pushedCenterX
				? dragged.left + dragged.width - this.allowedOverlap
				: dragged.left - pushed.width + this.allowedOverlap;
		} else {
			top = draggedCenterY < pushedCenterY
				? dragged.top + dragged.height - this.allowedOverlap
				: dragged.top - pushed.height + this.allowedOverlap;
		}

		const bounds = getAvailableScreenBounds();
		const hasSpace =
			left >= bounds.left &&
			top >= bounds.top &&
			left + pushed.width <= bounds.right &&
			top + pushed.height <= bounds.bottom;

		if (!hasSpace) {
			this.teleportWindow(pushed, currentTime);
			return;
		}

		this.moveWindow(pushed, left, top, currentTime);
	}

	teleportWindow(pushed, currentTime) {
		const position = findFreePosition(
			pushed.width,
			pushed.height,
			this.windows,
			this.allowedOverlap,
			pushed
		);

		if (!position) return;

		this.moveWindow(
			pushed,
			position.left,
			position.top,
			currentTime
		);
	}

	moveWindow(pushed, left, top, currentTime) {
		pushed.left = Math.round(left);
		pushed.top = Math.round(top);
		pushed.movement = 0;
		pushed.ignoreMovementUntil = currentTime + RELEASE_DELAY;
		pushed.popup.moveTo(pushed.left, pushed.top);
	}
}

function windowsOverlap(first, second, allowedOverlap) {
	return (
		first.left < second.left + second.width - allowedOverlap &&
		first.left + first.width - allowedOverlap > second.left &&
		first.top < second.top + second.height - allowedOverlap &&
		first.top + first.height - allowedOverlap > second.top
	);
}

function findFreePosition(
	width,
	height,
	windows,
	allowedOverlap = OVERLAP,
	ignoredWindow
) {
	const bounds = getAvailableScreenBounds();
	const maximumLeft = bounds.right - width;
	const maximumTop = bounds.bottom - height;

	const isFree = (left, top) => {
		const position = { left, top, width, height };
		return !windows.some(
			(other) =>
				other !== ignoredWindow &&
				windowsOverlap(position, other, allowedOverlap)
		);
	};

	for (let attempt = 0; attempt < 100; attempt += 1) {
		const left = randomInteger(bounds.left, maximumLeft);
		const top = randomInteger(bounds.top, maximumTop);

		if (isFree(left, top)) return { left, top };
	}

	for (let top = bounds.top; top <= maximumTop; top += 10) {
		for (let left = bounds.left; left <= maximumLeft; left += 10) {
			if (isFree(left, top)) return { left, top };
		}
	}

}

function randomInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function getAvailableScreenBounds() {
	const left = screen.availLeft || 0;
	const top = screen.availTop || 0;

	return {
		left,
		top,
		right: left + screen.availWidth,
		bottom: top + screen.availHeight
	};
}

export { findFreePosition };
export default WindowRepulsion;
