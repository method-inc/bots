var models = require('../models/index');
var Turn = models.Turn;

function log() {
  console.log(arguments);
}

function stringifyGameState(playerString, gameState) {
  return JSON.stringify({ player: playerString, state: gameState }) + '\n';
}

function tryParse(str) {
  var moves = [];
  try {
    moves = JSON.parse(str);
  } finally {
    return moves;
  }
}

function buildGameState(newState) {
  var gameState = Turn.build({
    rows: newState.rows,
    cols: newState.cols,
    maxTurns: newState.maxTurns,
    turnsElapsed: newState.turnsElapsed,
    grid: newState.grid,
    p1: newState.p1,
    p2: newState.p2,
  });

  gameState.winner = newState.winner;
  return gameState;
}

module.exports = {
  log: log,
  stringifyGameState: stringifyGameState,
  tryParse: tryParse,
  buildGameState: buildGameState,
};
