const redDots = [];
const blueDots = [];
let currentPlayer = 'red';
let neighbors, allRoutes, stack, visited, lastDotPlaced, count, innerColor, outerColor, winner, interval;
let gameOver = false;
let redSwitchTurnCount = 0;
let blueSwitchTurnCount = 0;
let level = 3;
let computerPlayer;
const capturedList = [];
const capturedEmptySpots = [];
let captureRoute = [];
let visitedFromStart = [];
const canvas = document.getElementById('gameBoard');
const context = canvas.getContext('2d');
canvas.addEventListener("click", placeDot, false)
let enemyDotInside = false;
let capturedBlues = 0;
let capturedReds = 0;
const place = new Audio('./sounds/place2.wav');
const error = new Audio('./sounds/error.wav');
const capture = new Audio('./sounds/capture.wav');
const victory = new Audio('./sounds/victory.wav');
const lose = new Audio('./sounds/lose.wav');
const tick = new Audio('./sounds/metronom.wav');
getColor();

function muteSounds() {
  place.muted = true;
  error.muted = true;
  capture.muted = true;
  victory.muted = true;
  lose.muted = true;
  tick.muted = true;
  toggleMuteButton();
}

function unmuteSounds() {
  place.muted = false;
  error.muted = false;
  capture.muted = false;
  victory.muted = false;
  lose.muted = false;
  tick.muted = false;
  toggleMuteButton()
}

function toggleMuteButton() {
const soundButton = document.getElementById('sound');
  if (place.muted) {
    soundButton.innerHTML = `<img src="./images/soundon.png" onClick="unmuteSounds()">`
  } else {
    soundButton.innerHTML = `<img src="./images/soundoff.png" onClick="muteSounds()">`
  }
}

function getColor() {
  if (currentPlayer === 'red') {
    innerColor = '#e60000';
    outerColor = '#800000';
    fillColor = 'rgba(230, 0, 0, 0.5)';
  } else if (currentPlayer === 'blue') {
    innerColor = '#0000ff';
    outerColor = '#000099';
    fillColor = 'rgba(0, 0, 255, 0.5)';
  }
}

function setLevel(id, dif) {
const ids = [easy, med, hard];
level = dif;
for (let i = 0; i < ids.length; i++ ) {
  if (ids[i].id !== id) {
    t = "#" + ids[i].id;
    $(t).removeClass('pressed-level-button').addClass('level-button');
  }
}
idx = "#" + id;
$(idx).removeClass('level-button').addClass('pressed-level-button').blur();
}

function startGame(player) {
  playWithComputer(player);
  createBoard();
  timer(level, document.getElementById('timer'));
  $('#game-title').removeClass('blue').addClass('red');
  $('#canvas-container').removeClass('border-start').addClass('red-border');
  $('chose-player-buttons, game-rules, #rules, #title, #button, #level-buttons').addClass('invisible');
  $('#winner-declaration, #gameBoard, #score-board, #timer-container').removeClass('invisible');
}

function playWithComputer(player) {
  if (player) {
    computerPlayer = true;
  } else {
    computerPlayer = false;
  }
}

function createBoard() {
  for (let i = 20; i <= 500; i += 20) {
    context.beginPath();
    context.moveTo(0, i);
    context.lineTo(500, i);
    context.lineWidth = 0.1;
    context.stroke();
  }

  for (let i = 20; i <= 500; i += 20) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, 500);
    context.lineWidth = 0.1;
    context.stroke();
  }
}

function zeroSwitchTurnCount() {
  if (currentPlayer === 'red') {
    redSwitchTurnCount = 0;
  } else {
    blueSwitchTurnCount = 0;
  }
}

function updatePos(pos) {
  return Math.round(pos / 20) * 20
}

function getCurrentPlayerDots(player) {
  if (player === 'red') {
    return redDots;
  } else {
    return blueDots;
  }
}

function empty(pos) {
  if (redDots.includeElement(pos) || blueDots.includeElement(pos) || capturedList.includeElement(pos)) {
    return false;
  }
  return true;
}

function validMove(pos) {
  if (empty(pos) && !capturedEmptySpots.includeElement(pos) && (pos[0] >= 0 && pos[0] <= 500) && (pos[1] >= 0 && pos[1] <= 500)) {
    return true;
  }
  return false;
}

function updateScores() {
  const redScores = document.getElementById('red-score-amount');
  const blueScores = document.getElementById('blue-score-amount');
  redScores.innerHTML = `${capturedReds}`
  blueScores.innerHTML = `${capturedBlues}`
}

function declareWinner() {
  window.clearInterval(interval);
  $('#declare-winner').removeClass('invisible');
  $('#timer-container').addClass('invisible');
  const winnerField = document.getElementById('winner-is');
  if (winner === 'Red Player') {
    winnerField.innerHTML = `The Winner is ${winner}`
    winnerField.className = 'red-winner'
  } else {
    winnerField.innerHTML = `The Winner is ${winner}`
    winnerField.className = 'blue-winner'
  }
  const buttonField = document.getElementById('restart-button');
  buttonField.innerHTML = `<input type="button" onClick="window.location.reload()" value="Play Again" />`
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
}

function placeDot(e) {
  const pos = getCursorPosition(canvas, e);
  const xPos = updatePos(pos[0]);
  const yPos = updatePos(pos[1]);
  if (validMove([xPos, yPos]) && !gameOver) {
    place.play();
    context.beginPath();
    context.arc(xPos, yPos, 5, 0, 2 * Math.PI);
    context.fillStyle = innerColor;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = outerColor;
    context.stroke();
    getCurrentPlayerDots(currentPlayer).push([xPos, yPos]);
    lastDotPlaced = [xPos, yPos];
    allRoutes = [];
    visitedFromStart = [];
    stack = [];
    visited = [];
    stack.push(lastDotPlaced);
    findRoutes(stack);
    createCapture(processAllRoutes());
    zeroSwitchTurnCount();
    switchPlayer();
    updateScores();
    checkWinner();
  } else {
    error.play();
  }
}

function findRoutes(stack) {
  if (stack.length < 1) { return }
  currentDot = stack.last();
  if (currentDot.equals(lastDotPlaced)) {
    count = 0;
    visited = []
  }
  count += 1;
  if (!visited.includeElement(currentDot)) {
    visited.push(currentDot);
  }
  let neighbor;
  if (currentDot.equals(lastDotPlaced)) {
    neighbor = findNeighborFromStart(currentDot);
      if (neighbor !== null && !visitedFromStart.includeElement(neighbor)) {
          visitedFromStart.push(neighbor);
        stack.push(neighbor);
        findRoutes(stack);
      } else {
        if (visited.last().equals(currentDot)) {
          allRoutes.push(stack.slice());
          count = 0;
          findRoutes(stack.popped());
        } else {
          count = 0;
          findRoutes(stack.popped());
        }
      }
    // from all other dots except starting dot
    } else {
      neighbor = findNeighbor(currentDot);
      if (neighbor !== null) {
        if (neighbor.equals(lastDotPlaced)) {
          stack.push(neighbor);
          allRoutes.push(stack.slice());
          count = 0;
          findRoutes(stack.popped());
        }
        stack.push(neighbor);
        findRoutes(stack);
      } else {
        if (visited.last().equals(currentDot)) {
          allRoutes.push(stack.slice());
          count = 0;
          findRoutes(stack.popped());
        } else {
          count = 0;
          findRoutes(stack.popped());
        }
      }
    }
}

function findNeighbor(dot) {
  const dotsAround = searchNeighborsOrder(lastDotPlaced, dot);
  for (let i = 0; i < dotsAround.length; i++) {
    const newDot = [dot[0] + dotsAround[i][0], dot[1] + dotsAround[i][1]]
    if (validNeighbor(newDot)) {
      return newDot;
    }
  }
  return null;
}

function findNeighborFromStart(dot) {
  const dotsAround = searchNeighborsOrder(lastDotPlaced, dot);
  for (let i = 0; i < dotsAround.length; i++) {
    const newDot = [dot[0] + dotsAround[i][0], dot[1] + dotsAround[i][1]]
    if (validNeightborFromStart(newDot)) {
      return newDot;
    }
  }
  return null;
}

function validNeightborFromStart(pos) {
  if (getCurrentPlayerDots(currentPlayer).includeElement(pos) && !visitedFromStart.includeElement(pos)) {
    return true;
  } else {
    return false;
  }
}

function validNeighbor(pos) {
  if (pos.equals(lastDotPlaced) && count > 2) {
    return true;
  }
  if (getCurrentPlayerDots(currentPlayer).includeElement(pos) && !visited.includeElement(pos)) {
    return true;
  } else {
    return false;
  }
};

function noValidNeighbors(pos) {
  const dotsAround = searchNeighborsOrder(lastDotPlaced, pos);
  let noNeibors = true;
  dotsAround.forEach((dot) => {
    if (getCurrentPlayerDots(currentPlayer).includeElement(dot) && !visited.includeElement(dot) && !visited.last().equal(dot)) {
      noNeibors = false;
    }
  });
  return noNeibors;
}

function processAllRoutes() {
  const winningRoutes = allRoutes.filter((route) => {
    if(route[0].equals(route.last())) {
      enemyDotInsideCheck(route)
      if (enemyDotInside) {
        return true;
      }
    }
  });
  const shortest = winningRoutes.getShortest();
  if (shortest.length > 0) {
    enemyDotInside = true;
    return shortest;
  }
}

function createCapture(dots) {
  if (enemyDotInside) {
    capture.play();
    context.beginPath();
    context.moveTo(getCurrentPlayerDots(currentPlayer)[0], getCurrentPlayerDots(currentPlayer)[1]);
      for(let i = 0; i < dots.length; i++) {
        context.lineTo(dots[i][0], dots[i][1]);
      }
    context.fillStyle = fillColor;
    context.fill()
    context.lineWidth = 1.5;
    context.strokeStyle = innerColor;
    context.stroke();
  }
}

function enemyDotInsideCheck(dots) {
  enemyDotInside = false;
  captureRoute = [];
  if (dots.length < 1) { return }
  let minY = 500;
  let maxY = 0;
  let minX = 500;
  let maxX = 0;
  dots.forEach((dot) => {
    if(dot[0] < minX) {
      minX = dot[0];
    }
    if(dot[0] > maxX) {
      maxX = dot[0];
    }
    if(dot[1] < minY) {
      minY = dot[1];
    }
    if(dot[1] > maxY) {
      maxY = dot[1];
    }
  })
  const indexesToDelete = [];
  const dotsToDelete = [];
  const bestCaptueRoute = [];

  function getEmptiesWithinCapture(pos) {
    const emptySpotsAround = [];
    const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
    for (let i = 0; i < dotsAround.length; i++) {
      const dot = [pos[0] + dotsAround[i][0], pos[1] + dotsAround[i][1]]
      if (empty(dot) && !capturedEmptySpots.includeElement(dot)) {
        if((dot[0] > minX && dot[0] < maxX) && (dot[1] > minY && dot[1] < maxY)) {
          capturedEmptySpots.push(dot);
          emptySpotsAround.push(dot);
      }
    }
  }
  if (emptySpotsAround.length > 0) {
    for (let i = 0; i < emptySpotsAround.length; i++) {
      getEmptiesWithinCapture(emptySpotsAround[i]);
    }
  }
}

  const enemyDots = getCurrentPlayerDots(lightSwitchPlayer());

  enemyDots.forEach((dot, i) => {
    if((dot[0] > minX && dot[0] < maxX) && (dot[1] > minY && dot[1] < maxY)) {
      increaseCaptures();
      enemyDotInside = true;
      indexesToDelete.push(i);
      dotsToDelete.push(dot);
      capturedList.push(dot);
      getEmptiesWithinCapture(dot);
    }
  });
  if (dotsToDelete.length > 0) {
    dotsToDelete.forEach((dot) => {
      const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
      dotsAround.forEach((dotAround) => {
        const newDot = [dot[0] + dotAround[0], dot[1] + dotAround[1]];
        if (getCurrentPlayerDots(currentPlayer).includeElement(newDot) && !bestCaptueRoute.includeElement(newDot)) {
          bestCaptueRoute.push(newDot);
        }
      });
    });
  }
  captureRoute = bestCaptueRoute;

  for (let j = indexesToDelete.length - 1; j >= 0; j--) {
    enemyDots.forEach((dot, i) => {
      if (indexesToDelete[j] == i) {
        enemyDots.splice(indexesToDelete[j], 1);
      }
    });
  }
}

function timer(count, display) {
  if (!gameOver) {
    function countDown() {
      if (count > 1) {
        tick.play()
        display.innerHTML = `Time left: ${count} seconds`;
      } else if (count === 1) {
        tick.play()
        display.innerHTML = `Time left: ${count} second`;
      } else {
        display.innerHTML = ``;
      }
      count--;
      if (count < 0) {
        window.clearInterval(interval);
        increaseSwitchTurnCount();
        switchPlayer();
      }
    }
    interval = setInterval(countDown, 1000);
  }
}

function increaseSwitchTurnCount() {
    if (currentPlayer === 'red') {
      redSwitchTurnCount++;
    } else {
      blueSwitchTurnCount++;
    }
}

function switchPlayer() {
  checkWinner();
  window.clearInterval(interval);
  enemyDotInside = false;
  if (currentPlayer === 'red' && computerPlayer) {
    currentPlayer = 'blue';
    immitateHuman();
    getColor();
    checkForCapture();
    timer(level, document.getElementById('timer'));
  } else if (currentPlayer === 'red' && !computerPlayer) {
    currentPlayer = 'blue';
    togglePlayerColor();
    getColor();
    checkForCapture();
    timer(level, document.getElementById('timer'));
  } else if (currentPlayer === 'blue') {
    currentPlayer = 'red';
    togglePlayerColor();
    getColor();
    checkForCapture();
    timer(level, document.getElementById('timer'));
  }
}

function togglePlayerColor() {
  if (!gameOver) {
    if (currentPlayer === 'red') {
      $('#canvas-container').removeClass('blue-border').addClass('red-border');
      $('#game-title').removeClass('blue').addClass('red');
    } else {
      $('#canvas-container').removeClass('red-border').addClass('blue-border');
      $('#game-title').removeClass('red').addClass('blue');
    }
  }
}

function immitateHuman() {
  if (redDots.length < 40) {
    setTimeout(computerMove, 400);
  } else if (redDots.length < 80) {
    setTimeout(computerMove, 300);
  } else if (redDots.length < 150) {
    setTimeout(computerMove, 200);
  } else if (redDots.length < 250) {
    setTimeout(computerMove, 100);
  }
  else {
    computerMove();
  }
}

function checkForCapture() {
  if (lastDotPlaced) {
  const captureBeforePlacing = checkFourAround(lastDotPlaced);
    if (captureBeforePlacing.length > 0) {
      createCapture(captureBeforePlacing);
      increaseCaptures();
    }
  }
}

function lightSwitchPlayer() {
  if (currentPlayer === 'red') {
    return 'blue';
  } else if (currentPlayer === 'blue') {
    return 'red';
  }
}

function increaseCaptures() {
  if (currentPlayer === 'red') {
    capturedBlues += 1;
  } else {
    capturedReds += 1;
  }
}

function checkWinner() {
  if ((capturedReds > 4 && computerPlayer) || (redDots.length < 1 && capturedReds > 0) || (blueDots.length > 0 && redSwitchTurnCount > 3)) {
    winner = 'Blue Player'
    lose.play();
    gameOver = true;
    declareWinner();
  }
  if ((capturedReds > 4 && !computerPlayer) || (redDots.length < 1 && capturedReds > 0) || (blueDots.length > 0 && redSwitchTurnCount > 3)) {
    winner = 'Blue Player'
    victory.play();
    gameOver = true;
    declareWinner();
  }
  if (capturedBlues > 4 || (blueDots.length < 1 && capturedBlues > 0) || (redDots.length > 0 && blueSwitchTurnCount > 3)) {
    winner = 'Red Player'
    victory.play();
    gameOver = true;
    declareWinner();
  }
}

function findEnemy(pos) {
  const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
  for (let i = 0; i < dotsAround.length; i++) {
    const dot = [pos[0] + dotsAround[i][0], pos[1] + dotsAround[i][1]]
    if (getCurrentPlayerDots(lightSwitchPlayer()).includeElement(dot)) {
      return dot;
    }
  }
  return [];
}

function getNeiborsFromStart(ownPos, enemyPos) {
  if (enemyPos.length < 1) {
    return [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]]
  }
  if (enemyPos[0] > ownPos[0] && enemyPos[1] == ownPos[1]) {
    return [[20, 0], [20, -20], [20, 20], [0, - 20], [0, 20], [-20, -20], [-20, 20], [-20, 0]]
  }
  if (enemyPos[0] > ownPos[0] && enemyPos[1] > ownPos[1]) {
    return [[20, 20], [20, 0], [0, 20], [20, -20], [-20, 20], [0, -20], [-20, 0], [-20, -20]]
  }
  if (enemyPos[0] == ownPos[0] && enemyPos[1] > ownPos[1]) {
    return [[0, 20], [-20, 20], [20, 20], [-20, 0], [20, 0], [-20, -20], [20, -20], [0, -20]]
  }
  if (enemyPos[0] < ownPos[0] && enemyPos[1] > ownPos[1]) {
    return [[-20, 20], [-20, 0], [0, 20], [-20, -20], [20, 20], [0, -20], [20, 0], [20, -20]]
  }
  if (enemyPos[0] < ownPos[0] && enemyPos[1] == ownPos[1]) {
    return [[-20, 0], [-20, -20], [-20, 20], [0, -20], [0, 20], [20, -20], [20, 20], [20, 0]]
  }
  if (enemyPos[0] < ownPos[0] && enemyPos[1] < ownPos[1]) {
    return [[-20, -20], [0, -20], [-20, 0], [-20, 20], [20, -20], [20, 0], [0, 20], [20, 20]]
  }
  if (enemyPos[0] == ownPos[0] && enemyPos[1] < ownPos[1]) {
    return [[0, -20], [-20, -20], [20, -20], [-20, 0], [20, 0], [-20, 20], [20, 20], [0, 20]]
  }
  if (enemyPos[0] > ownPos[0] && enemyPos[1] < ownPos[1]) {
    return [[20, -20], [0, -20], [20, 0], [-20, -20], [20, 20], [-20, 0], [0, -20], [-20, 20]]
  }
}

function searchNeighborsOrder(start, pos) {
    if (start[0] == pos[0] && start[1] == pos[1]) {
      return getNeiborsFromStart(pos, findEnemy(pos));
    }
    if (start[0] > pos[0] && start[1] == pos[1]) {
      return [[20, 0], [20, -20], [20, 20], [0, - 20], [0, 20], [-20, -20], [-20, 20], [-20, 0]]
    }
    if (start[0] > pos[0] && start[1] > pos[1]) {
      return [[20, 20], [20, 0], [0, 20], [20, -20], [-20, 20], [0, -20], [-20, 0], [-20, -20]]
    }
    if (start[0] == pos[0] && start[1] > pos[1]) {
      if (getCurrentPlayerDots(lightSwitchPlayer()).includeElement([pos[0] + 20, pos[1]])) {
        return [[0, 20], [-20, 20], [20, 20], [-20, 0], [20, 0], [20, -20], [-20, -20], [0, -20]]
      }
      return [[0, 20], [-20, 20], [20, 20], [-20, 0], [20, 0], [-20, -20], [20, -20], [0, -20]]
    }
    if (start[0] < pos[0] && start[1] > pos[1]) {
      return [[-20, 20], [-20, 0], [0, 20], [-20, -20], [20, 20], [0, -20], [20, 0], [20, -20]]
    }
    if (start[0] < pos[0] && start[1] == pos[1]) {
      return [[-20, 0], [-20, -20], [-20, 20], [0, -20], [0, 20], [20, -20], [20, 20], [20, 0]]
    }
    if (start[0] < pos[0] && start[1] < pos[1]) {
      return [[-20, -20], [0, -20], [-20, 0], [-20, 20], [20, -20], [20, 0], [0, 20], [20, 20]]
    }
    if (start[0] == pos[0] && start[1] < pos[1]) {
      return [[0, -20], [-20, -20], [20, -20], [-20, 0], [20, 0], [-20, 20], [20, 20], [0, 20]]
    }
    if (start[0] > pos[0] && start[1] < pos[1]) {
      return [[20, -20], [0, -20], [20, 0], [-20, -20], [20, 20], [0, 20], [-20, 0], [-20, 20]]
    }
}

// check for capture

function checkFourAround(pos) {
  const fourDotsAround = [[0, -20], [20, 0], [0, 20], [-20, 0]]
  const playerDots = getCurrentPlayerDots(currentPlayer);
  const confirmedPlayerDots = [];
  let count = 0;
  for (let i = 0; i < fourDotsAround.length; i++) {
    const newDot = [pos[0] + fourDotsAround[i][0], pos[1] + fourDotsAround[i][1]];
      if (playerDots.includeElement(newDot)) {
        count++;
        confirmedPlayerDots.push(newDot);
      }
  }
  if (count === 4) {
    enemyDotInside = true;
    confirmedPlayerDots.push(confirmedPlayerDots[0]);
    return confirmedPlayerDots;
  } else {
    return [];
  }
}

// Computer Player Logic

// priority 1 (checks 3 attacking dots around, defensive tactics)
function analyzeHumanDots() {
  const newTarget = [];
  for (let i = 0; i < blueDots.length; i++) {
    let countDots = 0;
    const pos = blueDots[i];
    const shift = [[20, 0], [- 20, 0], [0, 20], [0, - 20]]
    const dotsAround = [];
    shift.forEach((singleShift) => {
      const neighborDot = [pos[0] + singleShift[0], pos[1] + singleShift[1]];
      dotsAround.push(neighborDot);
      if (redDots.includeElement(neighborDot)) {
        countDots += 1;
      }
    });
    if (countDots === 3) {
      dotsAround.forEach((dot) => {
        if (empty(dot)) {
          newTarget.push(dot);
        }
      });
    }
  }
  return newTarget;
}

function getEmptySpotsAround(pos) {
  const emptySpotsAround = [];
  const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
  for (let i = 0; i < dotsAround.length; i++) {
    const dot = [pos[0] + dotsAround[i][0], pos[1] + dotsAround[i][1]]
    if (empty(dot)) {
      emptySpotsAround.push(dot);
    }
  }
  return emptySpotsAround;
}

function commonDots(arr1, arr2) {
  const commonDots = [];
    arr1.forEach((dotOne) => {
      arr2.forEach((dotTwo) => {
        if (dotOne.equals(dotTwo)) {
          commonDots.push(dotOne);
        }
      });
    });
  return commonDots;
}

// priority 2 (find common neighbor between two dots)
function findCommonNeighbor(arr) {
  for (let i = 0; i < arr.length; i++) {
    const emptySpotsOne = getEmptySpotsAround(arr[i]);
    for (let j = 0; j < arr.length; j++) {
      if (!arr[j].equals(arr[i]) && !sameColorDotsAround(arr, arr[i]).includeElement(arr[j])) {
        const emptySpotsTwo = getEmptySpotsAround(arr[j]);
          const commonDotsList = commonDots(emptySpotsOne, emptySpotsTwo);
          if (commonDotsList.length > 0) {
            return commonDotsList.last();
          }
      }
    }
  }
  return [];
}

function sameColorDotsAround(arr, pos) {
  const foundDotsAround = [];
  const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
  for (let i = 0; i < dotsAround.length; i++) {
    const dot = [pos[0] + dotsAround[i][0], pos[1] + dotsAround[i][1]]
    if (empty(dot) || arr.includeElement(dot)) {
      foundDotsAround.push(dot);
    }
  }
  return foundDotsAround;
}

function areNeighbors(pos1, pos2) {
  let neighbors = false;
  const dotsAround = [[-20, 0], [-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20]];
  dotsAround.forEach((shift) => {
    const newDot = [pos1[0] + shift[0], pos1[1] + shift[1]];
    if (newDot.equals(pos2)) {
      neighbors = true;
    }
  });
  return neighbors;
}

function farAwayNeighbor() {
  for (let i = 0; i < blueDots.length; i++) {
    const neighborsOne = getEmptySpotsAround(blueDots[i]);
      for (let j = 0; j < blueDots.length; j++) {
        if (!blueDots[j].equals(blueDots[i]) && !sameColorDotsAround(blueDots, blueDots[i]).includeElement(blueDots[j])) {
          const neighborsTwo = getEmptySpotsAround(blueDots[j]);
            if (commonDots(neighborsOne, neighborsTwo).length === 0) {
              for (let k = 0; k < neighborsOne.length; k++) {
                const neighborsThree = getEmptySpotsAround(neighborsOne[k]);
                for (let h = 0; h < neighborsTwo.length; h++) {
                  if ( neighborsThree.includeElement(neighborsTwo[h])) {
                    return neighborsTwo[h];
                  }
                }
              }
            }
        }
      }
  }
  return [];
}

function checkThreeEnemiesAround(pos) {
  const shift = [[20, 0], [- 20, 0], [0, 20], [0, - 20]]
  const dotsAround = [];
  let countDots = 0;
  shift.forEach((singleShift) => {
    const neighborDot = [pos[0] + singleShift[0], pos[1] + singleShift[1]];
    if (redDots.includeElement(neighborDot)) {
      countDots += 1;
      if (countDots > 2) {
        return true;
      }
    }
  });
  return false;
}

function computerMove() {
  if (!gameOver) {
    const pos = getCurrentPlayerDots(lightSwitchPlayer()).last();
    let newDot = findCommonNeighbor(blueDots);
    if (newDot.length < 1) {
      newDot = analyzeHumanDots();
      if (checkThreeEnemiesAround(newDot)) {
        computerMove();
      }
        if (newDot.length < 1) {
          newDot = findCommonNeighbor(redDots);
          if (newDot.length < 1) {
            const shift = [[pos[0] + 20, pos[1]], [pos[0] - 20, pos[1]], [pos[0], pos[1] + 20], [pos[0], pos[1] - 20]]
            newDot = shift.sample();
              if (validMove(newDot) && !checkThreeEnemiesAround(newDot)) {
                placeAiDot(newDot);
              } else {
                computerMove();
              }
          } else {
            if (validMove(newDot) && !checkThreeEnemiesAround(newDot)) {
              placeAiDot(newDot);
            } else {
              computerMove();
            }
          }
        } else {
          if (validMove(newDot[0]) && !checkThreeEnemiesAround(newDot)) {
            placeAiDot(newDot[0]);
          } else {
            computerMove();
          }
        }
    } else {
      if (validMove(newDot) && !checkThreeEnemiesAround(newDot)) {
        placeAiDot(newDot);
      } else {
        computerMove();
      }
    }
  }
}

function placeAiDot(pos) {
  getColor();
    context.beginPath();
    context.arc(pos[0], pos[1], 5, 0, 2 * Math.PI);
    context.fillStyle = innerColor;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = outerColor;
    context.stroke();
    getCurrentPlayerDots(currentPlayer).push([pos[0], pos[1]]);
    lastDotPlaced = pos;
    place.play();
    allRoutes = [];
    blueSwitchTurnCount = 0;
    visitedFromStart = [];
    stack = [];
    visited = [];
    stack.push(lastDotPlaced);
    findRoutes(stack);
    createCapture(processAllRoutes());
    switchPlayer();
    updateScores();
    checkWinner();
}

// Helper methods

Array.prototype.sample = function() {
  return this[Math.floor(Math.random() * this.length)];
}

Array.prototype.popped = function() {
  this.pop();
  return this;
}

Array.prototype.includeElement = function(element) {
  for(let i = 0; i < this.length; i++) {
    if (this[i].equals(element)) {
      return true;
    }
  }
  return false;
}

Array.prototype.last = function() {
  return this[this.length - 1];
}

Array.prototype.penult = function() {
  return this[this.length - 2];
}

Array.prototype.equals = function(arr) {
  return this.toString() === arr.toString() ? true : false;
}

Array.prototype.uniq = function() {
  const obj = {};
  const arr = [];
  for (let i = 0; i < this.length; i++) {
    if (obj.hasOwnProperty(this[i])) {
      continue;
    }
    arr.push(this[i]);
    obj[this[i]] = 1;
  }
  return arr;
}

Array.prototype.getShortest = function () {
  if (this.length === 0 || typeof this === 'undefined') {
    return [];
  }
  let shortestLength = this[0].length;
  let shortestElement = this[0];
  for(let i = 0; i < this.length; i++) {
    if (this[i].length < shortestLength) {
      shortestLength = this[i].length;
      shortestElement = this[i];
    }
  }
  return shortestElement;
}
