var utils = require('./utils');

module.exports = function testBot(gameState) {
  var moves = getMoves(gameState.state, gameState.player);
  return moves;
};

function getMoves(state, player) {
  var playerIndices;
  var moves = [];

  if (player === 'r') {
    playerIndices = utils.getAllIndices(state.grid, 'r');
  } else {
    playerIndices = utils.getAllIndices(state.grid, 'b');
  }

  playerIndices.forEach(function(playerIndex) {
    var adjacent = utils.getAdjacentIndices(state, playerIndex);
    var to = adjacent[Math.floor(Math.random()*adjacent.length)];
    moves.push({ from: playerIndex, to: to });
  });

  return moves;
}
