/* =========================================================
   1. GRAB ELEMENTS FROM THE HTML
   ========================================================= */
const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const timeEl = document.getElementById("time");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const startBtn = document.getElementById("start-btn");

/* =========================================================
   2. SETTINGS + GAME STATE
   ========================================================= */
const SPEED = 120; // milliseconds between moves (lower = faster)

// Size of one square, read from --cell-size in style.css
const cellSize = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue("--cell-size")
);

let cols = 0;           // how many squares fit across the board
let rows = 0;           // how many squares fit down the board

let snake = [];         // list of {x, y} squares, snake[0] is the head
let food = { x: 0, y: 0 };
let direction = "right";      // direction the snake is moving now
let nextDirection = "right";  // direction requested by the latest key press

let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let seconds = 0;              // seconds played in this round

let moveTimer = null;         // setInterval id for the game loop
let clockTimer = null;        // setInterval id for the stopwatch

/* =========================================================
   3. GRID SETUP
   Works out how many rows/columns fit on the screen and tells
   the CSS through the --cols and --rows variables.
   ========================================================= */
function setupGrid() {
  cols = Math.floor(board.clientWidth / cellSize);
  rows = Math.floor(board.clientHeight / cellSize);

  board.style.setProperty("--cols", cols);
  board.style.setProperty("--rows", rows);
}

/* =========================================================
   4. DRAWING
   Clears the board and draws the snake and food again.
   Squares are placed with grid-column / grid-row (these start at 1,
   but our x/y start at 0, so we add 1).
   ========================================================= */
function createSquare(x, y, className) {
  const square = document.createElement("div");
  square.className = "cell " + className;
  square.style.gridColumn = x + 1;
  square.style.gridRow = y + 1;
  return square;
}

function draw() {
  board.innerHTML = ""; // remove everything drawn last time

  board.appendChild(createSquare(food.x, food.y, "food"));
  snake.forEach((part) => {
    board.appendChild(createSquare(part.x, part.y, "snake"));
  });
}

/* =========================================================
   5. SCORE + TIME DISPLAY
   ========================================================= */
function updateScoreboard() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
}

// Turns 83 seconds into "01-23" (minutes-seconds)
function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return m + "-" + s;
}

/* =========================================================
   6. FOOD
   Picks a random free square (never on top of the snake).
   ========================================================= */
function placeFood() {
  let spot;
  do {
    spot = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some((part) => part.x === spot.x && part.y === spot.y));

  food = spot;
}

/* =========================================================
   7. ONE GAME STEP (runs every SPEED milliseconds)
   ========================================================= */
function step() {
  direction = nextDirection; // apply the latest key press

  // Work out where the head will be
  const head = { x: snake[0].x, y: snake[0].y };
  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  if (direction === "left") head.x--;
  if (direction === "right") head.x++;

  // Hit a wall?
  const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;

  // Hit itself?
  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head); // add the new head at the front

  if (head.x === food.x && head.y === food.y) {
    // Ate the food: keep the tail (snake grows) and add a point
    score++;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }
    updateScoreboard();
    placeFood();
  } else {
    snake.pop(); // no food: remove the tail so the length stays the same
  }

  draw();
}

/* =========================================================
   8. START + GAME OVER
   ========================================================= */
function startGame() {
  setupGrid();

  // Start in the middle with a snake 3 squares long, moving right
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  direction = "right";
  nextDirection = "right";

  // Reset score and time
  score = 0;
  seconds = 0;
  updateScoreboard();
  timeEl.textContent = formatTime(seconds);

  placeFood();
  draw();
  modal.classList.add("hidden");

  // Stop any old timers, then start fresh ones
  clearInterval(moveTimer);
  clearInterval(clockTimer);
  moveTimer = setInterval(step, SPEED);
  clockTimer = setInterval(() => {
    seconds++;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
}

function gameOver() {
  clearInterval(moveTimer);
  clearInterval(clockTimer);
  moveTimer = null;
  clockTimer = null;

  modalTitle.textContent = "Game Over";
  modalText.textContent = "Your score: " + score;
  startBtn.textContent = "Play Again";
  modal.classList.remove("hidden");
}

/* =========================================================
   9. KEYBOARD CONTROLS
   Arrow keys or W A S D. The snake can't turn straight back
   on itself (e.g. going right, then pressing left).
   ========================================================= */
document.addEventListener("keydown", (event) => {
  const key = event.key;

  // Enter or Space starts the game when the popup is showing
  if (!modal.classList.contains("hidden")) {
    if (key === "Enter" || key === " ") startGame();
    return;
  }

  if ((key === "ArrowUp" || key === "w") && direction !== "down") nextDirection = "up";
  if ((key === "ArrowDown" || key === "s") && direction !== "up") nextDirection = "down";
  if ((key === "ArrowLeft" || key === "a") && direction !== "right") nextDirection = "left";
  if ((key === "ArrowRight" || key === "d") && direction !== "left") nextDirection = "right";

  // Stop the page from scrolling when arrow keys are pressed
  if (key.startsWith("Arrow")) event.preventDefault();
});

startBtn.addEventListener("click", startGame);

/* =========================================================
   10. WINDOW RESIZE
   Recalculate rows/columns when the window size changes.
   ========================================================= */
window.addEventListener("resize", () => {
  setupGrid();
  // If the food ended up outside the smaller board, move it
  if (moveTimer && (food.x >= cols || food.y >= rows)) placeFood();
});

/* =========================================================
   11. INITIAL SCREEN
   Show the starting values and the Start popup.
   (This also removes the demo snake/food from the HTML.)
   ========================================================= */
setupGrid();
board.innerHTML = "";
updateScoreboard();
timeEl.textContent = formatTime(0);
modal.classList.remove("hidden");