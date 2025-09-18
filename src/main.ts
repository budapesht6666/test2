const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Grid settings
const cellSize = 20;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

// Game state
type Point = { x: number; y: number };
let snake: Point[] = [ { x: Math.floor(cols/2), y: Math.floor(rows/2) } ];
let direction: Point = { x: 1, y: 0 };
let pendingDirection: Point | null = null;
let food: Point = spawnFood();
let score = 0;
let speedMs = 120; // initial speed
let timerId: number | null = null;
let isPaused = false;
let isGameOver = false;

const scoreEl = document.getElementById('score')!;

function spawnFood(): Point {
  while (true) {
    const p: Point = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    if (!snake.some(s => s.x === p.x && s.y === p.y)) return p;
  }
}

function drawCell(p: Point, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize - 1, cellSize - 1);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background grid dots for aesthetics
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f1a33';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillRect(x * cellSize, y * cellSize, 1, 1);
    }
  }
}

function render() {
  drawBoard();
  // food
  drawCell(food, '#f43f5e');
  // snake
  for (let i = 0; i < snake.length; i++) {
    const seg = snake[i];
    const c = i === snake.length - 1 ? '#22c55e' : '#16a34a';
    drawCell(seg, c);
  }
  if (isGameOver) {
    overlayText('Игра окончена. Рестарт — R');
  } else if (isPaused) {
    overlayText('Пауза');
  }
}

function overlayText(text: string) {
  ctx.fillStyle = 'rgba(2,6,23,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function step() {
  if (isPaused || isGameOver) return;

  // apply pending direction if not reversing
  if (pendingDirection) {
    const next = pendingDirection;
    const last = direction;
    if (!(next.x === -last.x && next.y === -last.y)) {
      direction = next;
    }
    pendingDirection = null;
  }

  const head = snake[snake.length - 1];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // wrap around
  if (newHead.x < 0) newHead.x = cols - 1;
  if (newHead.x >= cols) newHead.x = 0;
  if (newHead.y < 0) newHead.y = rows - 1;
  if (newHead.y >= rows) newHead.y = 0;

  // collision with self
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver();
    render();
    return;
  }

  snake.push(newHead);

  // check food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    food = spawnFood();
    if (speedMs > 60) speedMs -= 4; // increase speed gradually
  } else {
    snake.shift(); // move forward
  }

  render();
}

function gameOver() {
  isGameOver = true;
  stopLoop();
}

function startLoop() {
  stopLoop();
  timerId = window.setInterval(step, speedMs);
}

function stopLoop() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetGame() {
  snake = [ { x: Math.floor(cols/2), y: Math.floor(rows/2) } ];
  direction = { x: 1, y: 0 };
  pendingDirection = null;
  food = spawnFood();
  score = 0;
  speedMs = 120;
  isPaused = false;
  isGameOver = false;
  scoreEl.textContent = '0';
  render();
}

// Input
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') pendingDirection = { x: 0, y: -1 };
  else if (key === 'arrowdown' || key === 's') pendingDirection = { x: 0, y: 1 };
  else if (key === 'arrowleft' || key === 'a') pendingDirection = { x: -1, y: 0 };
  else if (key === 'arrowright' || key === 'd') pendingDirection = { x: 1, y: 0 };
  else if (key === ' ') { isPaused = !isPaused; if (!isPaused) startLoop(); }
  else if (key === 'r') { resetGame(); startLoop(); }
});

(document.getElementById('start') as HTMLButtonElement).onclick = () => { if (isGameOver) resetGame(); isPaused = false; startLoop(); };
(document.getElementById('pause') as HTMLButtonElement).onclick = () => { isPaused = !isPaused; if (!isPaused) startLoop(); else stopLoop(); render(); };
(document.getElementById('reset') as HTMLButtonElement).onclick = () => { resetGame(); };

// initial render
render();

