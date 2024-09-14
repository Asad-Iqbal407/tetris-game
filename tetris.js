const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// Adjust scale for better visibility
context.scale(20, 20);

// Game arena dimensions
const arenaWidth = 12;
const arenaHeight = 20;

// Create the arena matrix
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Tetris pieces shapes
const pieces = 'TJLOSZI';

function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'J':
            return [
                [2, 0, 0],
                [2, 2, 2],
                [0, 0, 0],
            ];
        case 'L':
            return [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0],
            ];
        case 'O':
            return [
                [4, 4],
                [4, 4],
            ];
        case 'S':
            return [
                [0, 5, 5],
                [5, 5, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [6, 6, 0],
                [0, 6, 6],
                [0, 0, 0],
            ];
        case 'I':
            return [
                [0, 0, 0, 0],
                [7, 7, 7, 7],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ];
    }
}

// Collision detection
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

// Merge player piece into the arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Clear completed rows
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        if (arena[y].every(value => value !== 0)) {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;
            rowCount *= 2;
        }
    }
}

// Player object
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
};

// Game arena
const arena = createMatrix(arenaWidth, arenaHeight);

// Drop interval
let dropCounter = 0;
let dropInterval = 1000;

// Last time updated
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// Drawing the game
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(
                    x + offset.x,
                    y + offset.y,
                    1,
                    1
                );
            }
        });
    });
}

// Player controls
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerReset() {
    const piecesArray = pieces.split('');
    player.matrix = createPiece(
        piecesArray[(piecesArray.length * Math.random()) | 0]
    );
    player.pos.y = 0;
    player.pos.x =
        ((arenaWidth / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
    }
}

// Touch controls for mobile
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener(
    'touchstart',
    event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    },
    false
);

canvas.addEventListener(
    'touchend',
    event => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (
            Math.abs(deltaX) > Math.abs(deltaY)
        ) {
            // Horizontal swipe
            if (deltaX > 30) {
                // Swipe right
                playerMove(1);
            } else if (deltaX < -30) {
                // Swipe left
                playerMove(-1);
            }
        } else {
            // Vertical swipe
            if (deltaY > 30) {
                // Swipe down
                playerDrop();
            } else if (deltaY < -30) {
                // Swipe up (optional)
            } else {
                // Tap
                playerRotate(1);
            }
        }
    },
    false
);

// Prevent scrolling on touch devices
document.body.addEventListener(
    'touchmove',
    event => {
        event.preventDefault();
    },
    { passive: false }
);

// Start the game
playerReset();
update();
