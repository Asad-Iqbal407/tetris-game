// Constants
const COLS = 10;
const ROWS = 20;
const COLORS = ['red', 'green', 'blue', 'purple', 'orange', 'cyan', 'yellow'];
const SHAPES = [
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 0], [0, 1, 1]], // Z
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 1, 1]],         // I
    [[1, 1], [1, 1]],       // O
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]]  // J
];

// Game variables
let canvas;
let ctx;
let grid;
let piece;
let gameOver;
let score;
let level;
let gameLoop;
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;
let moveCounter = 0;
let moveInterval = 100;
let isLeftPressed = false;
let isRightPressed = false;
let isDownPressed = false;

// Initialize the game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    
    // Make canvas responsive
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    resetGame();
}

// Resize canvas to fit container and maintain aspect ratio
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const size = Math.min(containerWidth, containerHeight * 0.8);
    canvas.width = size;
    canvas.height = size * 2;

    ctx.scale(size / COLS, size / COLS);
}

// Reset the game state
function resetGame() {
    grid = createGrid();
    piece = randomPiece();
    gameOver = false;
    score = 0;
    level = 1;
    dropInterval = 1000;
    updateScore();
    updateLevel();
}

// Create an empty grid
function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Generate a random piece
function randomPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const color = COLORS[shapeIndex];
    const shape = SHAPES[shapeIndex];
    
    return {
        shape,
        color,
        x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
        y: 0
    };
}

// Draw the game state
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawPiece();
}

// Draw the grid
function drawGrid() {
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x, y, 1, 1);
            }
        });
    });
}

// Draw the current piece
function drawPiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = piece.color;
                ctx.fillRect(piece.x + x, piece.y + y, 1, 1);
            }
        });
    });
}

// Move the piece down
function moveDown() {
    piece.y++;
    if (collision()) {
        piece.y--;
        solidifyPiece();
        removeFullRows();
        piece = randomPiece();
        if (collision()) {
            gameOver = true;
            endGame();
        }
    }
    dropCounter = 0;
}

// Move the piece left or right
function move(dx) {
    piece.x += dx;
    if (collision()) {
        piece.x -= dx;
    }
}

// Rotate the piece
function rotate() {
    const rotated = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    const previousShape = piece.shape;
    piece.shape = rotated;
    if (collision()) {
        piece.shape = previousShape;
    }
}

// Check for collisions
function collision() {
    return piece.shape.some((row, dy) =>
        row.some((value, dx) => {
            if (!value) return false;
            const newX = piece.x + dx;
            const newY = piece.y + dy;
            return (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS ||
                (newY >= 0 && grid[newY][newX])
            );
        })
    );
}

// Solidify the piece into the grid
function solidifyPiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                grid[piece.y + y][piece.x + x] = COLORS.indexOf(piece.color) + 1;
            }
        });
    });
}

// Remove full rows and update score
function removeFullRows() {
    let rowsCleared = 0;
    grid.forEach((row, y) => {
        if (row.every(value => value !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(COLS).fill(0));
            rowsCleared++;
        }
    });
    if (rowsCleared > 0) {
        score += [40, 100, 300, 1200][rowsCleared - 1] * level;
        updateScore();
        checkLevelUp();
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Check for level up
function checkLevelUp() {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100); // Speed up as level increases
        updateLevel();
    }
}

// Update level display
function updateLevel() {
    document.getElementById('level').textContent = level;
}

// Game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    moveCounter += deltaTime;

    if (dropCounter > dropInterval) {
        moveDown();
    }

    if (moveCounter > moveInterval) {
        if (isLeftPressed) move(-1);
        if (isRightPressed) move(1);
        if (isDownPressed) moveDown();
        moveCounter = 0;
    }

    draw();
    if (!gameOver) {
        gameLoop = requestAnimationFrame(update);
    }
}

// Start the game
function startGame() {
    resetGame();
    lastTime = 0;
    dropCounter = 0;
    moveCounter = 0;
    gameLoop = requestAnimationFrame(update);
    document.getElementById('start-button').disabled = true;
    document.getElementById('game-over').style.display = 'none';
}

// End the game
function endGame() {
    cancelAnimationFrame(gameLoop);
    document.getElementById('start-button').disabled = false;
    document.getElementById('game-over').style.display = 'block';
}

// Event listeners
document.addEventListener('keydown', event => {
    if (gameOver) return;

    switch(event.key) {
        case 'ArrowLeft':
            isLeftPressed = true;
            break;
        case 'ArrowRight':
            isRightPressed = true;
            break;
        case 'ArrowDown':
            isDownPressed = true;
            break;
        case 'ArrowUp':
            rotate();
            break;
    }
});

document.addEventListener('keyup', event => {
    switch(event.key) {
        case 'ArrowLeft':
            isLeftPressed = false;
            break;
        case 'ArrowRight':
            isRightPressed = false;
            break;
        case 'ArrowDown':
            isDownPressed = false;
            break;
    }
});

// Resize canvas to fit container and maintain aspect ratio
function resizeCanvas() {
    const gameWrapper = document.querySelector('.game-wrapper');
    const wrapperWidth = gameWrapper.clientWidth;
    const wrapperHeight = gameWrapper.clientHeight;

    // Adjust the canvas to fit the screen, maintaining a 2:1 aspect ratio
    const size = Math.min(wrapperWidth, wrapperHeight / 2);
    canvas.width = size;
    canvas.height = size * 2;

    ctx.scale(size / COLS, size / COLS);
}


// Initialize the game
init();

// Expose startGame function to global scope
window.startGame = startGame;
