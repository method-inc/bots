var gridIds = {
  spawn:'s',
  player1:'a',
  player2:'b',
  food:'f',
  empty:'.'
};

exports.createGame = function() {
  var gameState = {};
  gameState.length = 20;
  gameState.width = 20;
  gameState.grid = Array(gameState.length*gameState.width+1).join(gridIds.empty); //create empty grid
  console.log(gameState.grid);

  setCoord(gameState, 10, 10, 'x');

  return gameState;
};

function getCoord(state, x, y) {
  var index = state.length * y + x;
  return state.grid[index];
}
function setCoord(state, x, y, val) {
  var index = state.length * y + x;
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}

function showGrid(state) {
  for(var y=0; y<state.length; y++) {
    var row = '';
    for(var x=0; x<state.width; x++) {
      row += state.grid[state.length * y + x];
    }
    console.log(row+'\n');
  }
}
