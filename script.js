const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const timeEl = document.getElementById("time");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const startBtn = document.getElementById("start-btn");

const SPEED = 120;


const cellSize = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue("--cell-size")
);

let cols = 0;
let rows = 0;

let snake = [];
let food = { x: 0, y: 0 };
let direction = "right"; 
let nextDirection = "right";  

let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let seconds = 0;              

let moveTimer = null;         
let clockTimer = null;        


function setupGrid() {
  cols = Math.floor(board.clientWidth / cellSize);
  rows = Math.floor(board.clientHeight / cellSize);

  board.style.setProperty("--cols", cols);
  board.style.setProperty("--rows", rows);
}

function createSquare(x, y, className) {
  const square = document.createElement("div");
  square.className = "cell " + className;
  square.style.gridColumn = x + 1;
  square.style.gridRow = y + 1;
  return square;
}

function draw() {
  board.innerHTML = ""; 

  board.appendChild(createSquare(food.x, food.y, "food"));
  snake.forEach((part) => {
    board.appendChild(createSquare(part.x, part.y, "snake"));
  });
}


function updateScoreboard() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
}


function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return m + "-" + s;
}

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

function step() {
  direction = nextDirection; 

  
  const head = { x: snake[0].x, y: snake[0].y };
  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  if (direction === "left") head.x--;
  if (direction === "right") head.x++;

  
  const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;

  
  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head); 

  if (head.x === food.x && head.y === food.y) {
    
    score++;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }
    updateScoreboard();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}


function startGame() {
  setupGrid();


  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  direction = "right";
  nextDirection = "right";


  score = 0;
  seconds = 0;
  updateScoreboard();
  timeEl.textContent = formatTime(seconds);

  placeFood();
  draw();
  modal.classList.add("hidden");


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

document.addEventListener("keydown", (event) => {
  const key = event.key;


  if (!modal.classList.contains("hidden")) {
    if (key === "Enter" || key === " ") startGame();
    return;
  }

  if ((key === "ArrowUp" || key === "w") && direction !== "down") nextDirection = "up";
  if ((key === "ArrowDown" || key === "s") && direction !== "up") nextDirection = "down";
  if ((key === "ArrowLeft" || key === "a") && direction !== "right") nextDirection = "left";
  if ((key === "ArrowRight" || key === "d") && direction !== "left") nextDirection = "right";


  if (key.startsWith("Arrow")) event.preventDefault();
});

startBtn.addEventListener("click", startGame);

window.addEventListener("resize", () => {
  setupGrid();
  
  if (moveTimer && (food.x >= cols || food.y >= rows)) placeFood();
});

setupGrid();
board.innerHTML = "";
updateScoreboard();
timeEl.textContent = formatTime(0);
modal.classList.remove("hidden");
