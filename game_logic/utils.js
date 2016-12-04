var distance = {
  move: 1,
  raze: 1,
  attack: 1,
  energy: 0,
  spawn: 1,
};

function log() {
  console.log(arguments);
}

function stringifyGameState(player, state, gameId) {
  return JSON.stringify({ player, state, gameId }) + '\n';
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
  var gameState = {
    rows: newState.rows,
    cols: newState.cols,
    maxTurns: newState.maxTurns,
    turnsElapsed: newState.turnsElapsed,
    grid: newState.grid,
    p1: newState.p1,
    p2: newState.p2,
    winner: newState.winner,
  };

  return gameState;
}

function getAllIndices(grid, search) {
  var arr = [];
  if(search === '.') search = '\\.';
  var re = new RegExp(search, 'g');
  while (m = re.exec(grid)) {
    arr.push(m.index);
  }
  return arr;
};

function getAdjacentIndices(state, index) {
  var indices = [];
  var coord = indexToCoord(state, index);
  if(coord.x > 0)
    indices.push(coordToIndex(state, { x: coord.x - 1, y: coord.y }));
  if(coord.x < state.cols-1)
    indices.push(coordToIndex(state, { x: coord.x + 1, y: coord.y }));
  if(coord.y > 0)
    indices.push(coordToIndex(state, { x: coord.x, y: coord.y - 1 }));
  if(coord.y < state.rows-1)
    indices.push(coordToIndex(state, { x: coord.x, y: coord.y + 1 }));

  return indices;
}
function getMirroredIndex(state, index) {
  var coord = indexToCoord(state, index);
  var mirroredCoord = { x: state.cols - 1 - coord.x, y: state.rows - 1 - coord.y };
  var mirroredIndex = coordToIndex(state, mirroredCoord);
  if(mirroredIndex !== index) {
    return mirroredIndex;
  } else {
    return -1;
  }
}

function getCoord(state, coord) {
  var index = coordToIndex(state, coord);
  return state.grid[index];
}

function setCoord(state, coord, val) {
  var index = coordToIndex(state, coord);
  state.grid = state.grid.substr(0, index) + val + state.grid.substr(index + 1);
}

function setIndex(state, index, val) {
  state.grid = state.grid.substr(0, index) + val + state.grid.substr(index+1);
}

function showGrid(state) {
  for(var y=0; y<state.rows; y++) {
    var row = '';
    for(var x=0; x<state.cols; x++) {
      row += state.grid[coordToIndex(state, { x: x, y: y })];
    }
    console.log(row+'\n');
  }
}

function makeEmptyGrid(rows, cols, key) {
  return Array(rows*cols+1).join(key);
}

function adjacent(state, index1, index2) {
  if(index1 < state.grid.length && index2 < state.grid.length && index1 >= 0 && index2 >= 0) {
    var coord1 = indexToCoord(state, index1);
    var coord2 = indexToCoord(state, index2);
    var horizontal = Math.abs(coord1.x-coord2.x);
    var vertical = Math.abs(coord1.y-coord2.y);
    if((horizontal <= distance.move && vertical === 0) ||
      (vertical <= distance.move && horizontal === 0)) {
      return true;
    }
  }
  return false;
}

function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return { x: x, y: y };
}

function coordToIndex(state, coord) {
  return state.cols * coord.y + coord.x;
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = {
  log,
  stringifyGameState,
  tryParse,
  buildGameState,
  getAllIndices,
  getAdjacentIndices,
  getMirroredIndex,
  getCoord,
  setCoord,
  setIndex,
  showGrid,
  makeEmptyGrid,
  adjacent,
  indexToCoord,
  coordToIndex,
  copyObj
};
