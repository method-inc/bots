var gridIds = {
  p1Spawn:'0',
  p2Spawn:'1',
  player1:'a',
  player2:'b',
  food:'*',
  empty:'.'
};

exports.create = function() {
  var gameState = {};
  gameState.rows = 20;
  gameState.cols = 20;
  gameState.grid = Array(gameState.rows*gameState.cols+1).join(gridIds.empty); //create empty grid

  setCoord(gameState, 1, 1, gridIds.p1Spawn);
  setCoord(gameState, gameState.cols-2, gameState.rows-2, gridIds.p2Spawn);

  return gameState;
};

function getCoord(state, x, y) {
  var index = state.rows * y + x;
  return state.grid[index];
}
function setCoord(state, x, y, val) {
  var index = state.rows * y + x;
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}

function showGrid(state) {
  for(var y=0; y<state.rows; y++) {
    var row = '';
    for(var x=0; x<state.cols; x++) {
      row += state.grid[state.rows * y + x];
    }
    console.log(row+'\n');
  }
}
