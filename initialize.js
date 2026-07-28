// export function initialize() {
// 	return [
// 		[
// 			[0, 0, 0, 0],
// 			[0, 1, 1, 0],
// 			[0, 0, 0, 0]
// 		],
// 		{
// 			id: 1,
// 			start_x: 0,
// 			start_y: 0,
// 			end_x: 2,
// 			end_y: 1
// 		},
// 		{
// 			id: 2,
// 			start_x: 0,
// 			start_y: 2,
// 			end_x: 2,
// 			end_y: 3
// 		}
// 	];
// }
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function initialize(width = 25, height = 17, pieceCount = 8) {
    const pieceColumns = 4;
    const pieceRows = pieceCount / pieceColumns;
    const grid = Array.from({ length: height }, () => Array(width).fill(0));
    const visited = Array.from({ length: height }, () => Array(width).fill(false));

    function carve(x, y) {
        visited[y][x] = true;
        grid[y][x] = 1;

        const dirs = shuffle([
            [0, -2],
            [0, 2],
            [-2, 0],
            [2, 0]
        ]);

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[ny][nx]) {
                grid[y + dy / 2][x + dx / 2] = 1;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);

    const pieces = [];

    for (let pieceRow = 0; pieceRow < pieceRows; pieceRow++) {
        for (let pieceColumn = 0; pieceColumn < pieceColumns; pieceColumn++) {
            pieces.push({
                id: pieces.length + 1,
                start_x: Math.floor(pieceRow * height / pieceRows),
                start_y: Math.floor(pieceColumn * width / pieceColumns),
                end_x: Math.floor((pieceRow + 1) * height / pieceRows) - 1,
                end_y: Math.floor((pieceColumn + 1) * width / pieceColumns) - 1
            });
        }
    }

    return [grid, ...pieces];
}
