const grid = document.getElementById("grid");
const movesDisplay = document.getElementById("moves");
const scoreDisplay = document.getElementById("score");
const hintBox = document.getElementById("hint-box");

const soundEnabled = { value: true };
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");

let board = [];
let score = 0;
let movesLeft = 10;
let path = [];
let bestPath = [];
let playerPos = { x: 3, y: 3 };

function getCell(x, y) {
  return board.find(c => +c.dataset.x === x && +c.dataset.y === y);
}

function createBoard() {
  grid.innerHTML = "";
  hintBox.textContent = "";
  board = [];
  path = [{ x: 3, y: 3 }];
  bestPath = [];
  score = 0;
  movesLeft = 10;

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (x === 3 && y === 3) {
        cell.dataset.value = 0;
        cell.classList.add("current", "collected");
        cell.textContent = "";
      } else {
        const val = Math.floor(Math.random() * 9) + 1;
        cell.dataset.value = val;
        cell.textContent = val;
        cell.classList.remove("collected");
      }

      cell.dataset.x = x;
      cell.dataset.y = y;
      grid.appendChild(cell);
      board.push(cell);
    }
  }

  playerPos = { x: 3, y: 3 };
  updateUI();
}

function updateUI() {
  movesDisplay.textContent = movesLeft;
  scoreDisplay.textContent = score;

  board.forEach(cell => {
    const x = +cell.dataset.x;
    const y = +cell.dataset.y;
    const isCurrent = x === playerPos.x && y === playerPos.y;
    const inPath = path.some(p => p.x === x && p.y === y);

    cell.classList.remove("current", "your-path");

    if (isCurrent) cell.classList.add("current");
    if (inPath) cell.classList.add("your-path");
  });

  if (movesLeft <= 0 || score >= 55) {
    calculateBestPath();
    showWinScreen(score >= 55 ? "Вы прошли уровень!" : "Вы проиграли!");
  }
}

function movePlayer(dx, dy) {
  if (movesLeft <= 0) return;

  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;
  if (nx < 0 || ny < 0 || nx >= 7 || ny >= 7) return;

  const cell = getCell(nx, ny);
  if (!cell) return;

  playSound(moveSound);
  playerPos = { x: nx, y: ny };
  path.push({ x: nx, y: ny });

  if (!cell.classList.contains("collected")) {
    score += parseInt(cell.dataset.value);
    cell.classList.add("collected");
    cell.textContent = "";
  }

  movesLeft--;
  updateUI();
}

function getNeighbors(x, y) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return dirs
    .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
    .filter(p => p.x >= 0 && p.y >= 0 && p.x < 7 && p.y < 7);
}

function getBestPathHint() {
  const start = playerPos;
  let maxScore = -Infinity;
  let bestSteps = [];

  const firstMoves = getNeighbors(start.x, start.y);
  for (const f of firstMoves) {
    const firstCell = getCell(f.x, f.y);
    if (!firstCell || firstCell.classList.contains("collected")) continue;

    const firstScore = parseInt(firstCell.dataset.value);
    const secondMoves = getNeighbors(f.x, f.y);

    for (const s of secondMoves) {
      const secondCell = getCell(s.x, s.y);
      if (!secondCell || secondCell.classList.contains("collected")) continue;
      if (s.x === start.x && s.y === start.y) continue;

      const secondScore = parseInt(secondCell.dataset.value);
      const total = firstScore + secondScore;

      if (total > maxScore) {
        maxScore = total;
        bestSteps = [f, s];
      }
    }
  }

  if (bestSteps.length) {
    const dir1 = getDirection(start, bestSteps[0]);
    const dir2 = getDirection(bestSteps[0], bestSteps[1]);
    hintBox.textContent = `Двигайтесь ${dir1} и ${dir2}`;
  } else {
    hintBox.textContent = "Нет выгодных ходов";
  }
}

function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1) return "вправо";
  if (dx === -1) return "влево";
  if (dy === 1) return "вниз";
  if (dy === -1) return "вверх";
  return "";
}

let maxPossibleScore = 0;
function calculateBestPath() {
  const start = { x: 3, y: 3 };
  let queue = [{
    x: start.x, y: start.y,
    path: [], visited: new Set(["3,3"]),
    score: 0
  }];
  let best = { path: [], score: -1 };

  while (queue.length) {
    const { x, y, path: pth, visited, score } = queue.shift();

    if (pth.length >= 10) {
      if (score > best.score) best = { path: pth, score };
      continue;
    }

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= 7 || ny >= 7) continue;
      if (visited.has(key)) continue;

      const cell = getCell(nx, ny);
      if (!cell) continue;

      const val = cell.classList.contains("collected") ? 0 : parseInt(cell.dataset.value);
      const newPath = [...pth, { x: nx, y: ny }];
      const newVisited = new Set(visited);
      newVisited.add(key);
      queue.push({ x: nx, y: ny, path: newPath, visited: newVisited, score: score + val });
    }
  }

  bestPath = best.path;
  maxPossibleScore = best.score;
}

function showWinScreen(message) {
  document.getElementById("game").classList.add("hidden");
  document.getElementById("win-screen").classList.remove("hidden");
  document.getElementById("win-result").textContent = message;

  
  const scoreInfoContainer = document.querySelector("#win-screen #score-info");
  if (scoreInfoContainer) {
    scoreInfoContainer.innerHTML = "";
  } else {
    const container = document.createElement("div");
    container.id = "score-info";
    document.querySelector("#win-screen h2").after(container);
  }

  const infoHTML = `
    <p>Ваш счёт: <strong>${score}</strong></p>
    <p>Максимальное количество очков: <strong>${maxPossibleScore}</strong></p>
  `;
  document.querySelector("#win-screen #score-info").innerHTML = infoHTML;

  const userGrid = document.getElementById("path-comparison-user");
  const bestGrid = document.getElementById("path-comparison-best");
  userGrid.innerHTML = "";
  bestGrid.innerHTML = "";

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const originalCell = getCell(x, y); 
      const value = originalCell ? originalCell.dataset.value : "0";

      const userCell = document.createElement("div");
      const bestCell = document.createElement("div");

      userCell.className = "mini-cell";
      bestCell.className = "mini-cell";

      userCell.textContent = value;
      bestCell.textContent = value;

      userCell.style.color = "white";
      bestCell.style.color = "white";

      if (path.some(p => p.x === x && p.y === y)) {
        userCell.style.backgroundColor = "red";
      }

      const index = bestPath.findIndex(p => p.x === x && p.y === y);
      if (index >= 0) {
        bestCell.style.backgroundColor = "limegreen";
        if (index < bestPath.length - 1) {
          const next = bestPath[index + 1];
          const arrow = document.createElement("div");
          arrow.className = "arrow";
          arrow.textContent = getArrow(bestPath[index], next);
          bestCell.appendChild(arrow);
        }
      }

      userGrid.appendChild(userCell);
      bestGrid.appendChild(bestCell);
    }
  }

  if (message.includes("прошли")) playSound(winSound);
}

function getArrow(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1) return "";
  if (dx === -1) return "";
  if (dy === 1) return "";
  if (dy === -1) return "";
  return "";
} 

function playSound(sound) {
  if (soundEnabled.value) {
    sound.currentTime = 0;
    sound.play();
  }
}

// Управление с клавиатуры
document.addEventListener("keydown", e => {
  switch (e.key.toLowerCase()) {
    case "arrowup": case "w": movePlayer(0, -1); break;
    case "arrowdown": case "s": movePlayer(0, 1); break;
    case "arrowleft": case "a": movePlayer(-1, 0); break;
    case "arrowright": case "d": movePlayer(1, 0); break;
  }
});

document.querySelectorAll(".arrow-btn").forEach(button => {
  button.addEventListener("click", () => {
    const dir = button.dataset.direction;
    switch (dir) {
      case "up": movePlayer(0, -1); break;
      case "down": movePlayer(0, 1); break;
      case "left": movePlayer(-1, 0); break;
      case "right": movePlayer(1, 0); break;
    }
  });
});

// Кнопка "Начать игру"
document.getElementById("start").onclick = () => {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  createBoard();
};

// Кнопка звука
document.getElementById("sound-toggle").onclick = () => {
  soundEnabled.value = !soundEnabled.value;
  document.getElementById("sound-toggle").textContent = "Звук: " + (soundEnabled.value ? "ВКЛ" : "ВЫКЛ");
};

// Подсказка
document.getElementById("hint-btn").onclick = () => {
  getBestPathHint();
};

// Кнопка "Играть заново"
function restartGame() {
  document.getElementById("win-screen").classList.add("hidden");
  createBoard();
  document.getElementById("game").classList.remove("hidden");
}

// Кнопка "В меню"
function backToMenu() {
  document.getElementById("win-screen").classList.add("hidden");
  document.getElementById("game").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
}
