var utils = require('../utils');

module.exports = function testBot(gameState) {
  var game = JSON.parse(gameState);
  var moves = getMoves(game.state, game.player);
  return moves;
};

function getMoves(state, player) {
  var energy;
  var spawn;
  var enemyenergy;
  var enemySpawn;
  var playerIndices;
  var enemyIndices;
  var moves = [];

  if(player === 'r') {
    energy = state.p1.energy;
    spawn = state.p1.spawn;
    enemyenergy = state.p2.energy;
    enemySpawn = state.p2.spawn;
    playerIndices = utils.getAllIndices(state.grid, 'r');
    enemyIndices = utils.getAllIndices(state.grid, 'b');
  }
  else {
    energy = state.p2.energy;
    spawn = state.p2.spawn;
    enemyenergy = state.p1.energy;
    enemySpawn = state.p1.spawn;
    playerIndices = utils.getAllIndices(state.grid, 'b');
    enemyIndices = utils.getAllIndices(state.grid, 'r');
  }

  playerIndices.forEach(function(playerIndex) {
    var adjacent = utils.getAdjacentIndices(state, playerIndex);
    var to = adjacent[Math.floor(Math.random()*adjacent.length)];
    moves.push({from:playerIndex, to:to});
  })

  return moves;
}
