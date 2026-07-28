export const OVERLAP = 16;

class WindowRepulsion {
	constructor(allowedOverlap = OVERLAP) {
		this.allowedOverlap = allowedOverlap;
		this.windows = [];
		this.animate = this.animate.bind(this);
		window.requestAnimationFrame(this.animate);
	}

	animate() {
		this.update();
		window.requestAnimationFrame(this.animate);
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
			deltaX: 0,
			deltaY: 0,
			movingByCode: false
		});
	}

	reset() {
		for (const item of this.windows) {
			item.popup.close();
		}

		this.windows = [];
	}

	update() {
		this.windows = this.windows.filter((item) => !item.popup.closed);

		for (const item of this.windows) {
			this.updateWindowInformation(item);
		}

		const queue = this.windows
			.filter((item) => item.deltaX || item.deltaY)
			.map((item) => ({
				item,
				deltaX: item.deltaX,
				deltaY: item.deltaY
			}));
		const movedWindows = new Set(queue.map((movement) => movement.item));

		for (let index = 0; index < queue.length; index += 1) {
			this.pushCollidingWindows(
				queue[index],
				queue,
				movedWindows
			);
		}
	}

	updateWindowInformation(item) {
		const newLeft = item.popup.screenX;
		const newTop = item.popup.screenY;
		const deltaX = newLeft - item.left;
		const deltaY = newTop - item.top;
		const movement = Math.hypot(deltaX, deltaY);

		item.width = item.popup.outerWidth;
		item.height = item.popup.outerHeight;

		if (item.movingByCode) {
			item.deltaX = 0;
			item.deltaY = 0;

			if (movement <= 1) {
				item.left = newLeft;
				item.top = newTop;
				item.movingByCode = false;
			} else {
				item.popup.moveTo(item.left, item.top);
			}

			return;
		}

		item.left = newLeft;
		item.top = newTop;
		item.deltaX = deltaX;
		item.deltaY = deltaY;
	}

	pushCollidingWindows(movement, queue, movedWindows) {
		const { item, deltaX, deltaY } = movement;

		for (const other of this.windows) {
			if (
				movedWindows.has(other) ||
				!windowsOverlap(item, other, this.allowedOverlap)
			) {
				continue;
			}

			movedWindows.add(other);

			const left = other.left + deltaX;
			const top = other.top + deltaY;

			if (!fitsOnScreen(other, left, top)) {
				this.teleportWindow(other);
				continue;
			}

			this.moveWindow(other, left, top);
			queue.push({ item: other, deltaX, deltaY });
		}
	}

	teleportWindow(pushed) {
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
			position.top
		);
	}

	moveWindow(pushed, left, top) {
		pushed.left = Math.round(left);
		pushed.top = Math.round(top);
		pushed.deltaX = 0;
		pushed.deltaY = 0;
		pushed.movingByCode = true;
		pushed.popup.setManagedPosition?.(pushed.left, pushed.top);
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

function fitsOnScreen(item, left, top) {
	const bounds = getAvailableScreenBounds();
	return (
		left >= bounds.left &&
		top >= bounds.top &&
		left + item.width <= bounds.right &&
		top + item.height <= bounds.bottom
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
