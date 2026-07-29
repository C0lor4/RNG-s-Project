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
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function initialize(width, height, pieceCount) {
    const grid = Array.from({ length: height }, () => Array(width).fill(0)); // 初始化地图
    const visited = Array.from({ length: height }, () => Array(width).fill(false));

    function dfs(x, y) { // 深度优先搜索 (两格跳着走)
        visited[y][x] = true;
        grid[y][x] = 1;

        const dirs = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]]);

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[ny][nx]) {
                grid[y + dy / 2][x + dx / 2] = 1;
                dfs(nx, ny);
            }
        }
    }

    dfs(1, 1);

    const pieces = [];
    const pieceRows = pieceCount / 4;

    for (let pieceRow = 0; pieceRow < pieceRows; pieceRow++) {
        for (let pieceColumn = 0; pieceColumn < 4; pieceColumn++) {
            pieces.push({
                id: pieces.length + 1,
                start_x: Math.floor(pieceRow * height / pieceRows),
                start_y: Math.floor(pieceColumn * width / 4),
                end_x: Math.floor((pieceRow + 1) * height / pieceRows) - 1,
                end_y: Math.floor((pieceColumn + 1) * width / 4) - 1
            });
        }
    }

    return [grid, ...pieces];
}
