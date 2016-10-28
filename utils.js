var distance = {
  move:1,
  raze:1,
  attack:1,
  energy:0,
  spawn:1
};

var exports = module.exports = {};

exports.getAllIndices = function(grid, search) {
  var arr = [];
  if(search === '.') search = '\\.';
  var re = new RegExp(search, 'g');
  while (m = re.exec(grid)) {
    arr.push(m.index);
  }
  return arr;
};

exports.getAdjacentIndices = function(state, index) {
  var indices = [];
  var coord = exports.indexToCoord(state, index);
  if(coord.x > 0)
    indices.push(exports.coordToIndex(state, {x:coord.x-1, y:coord.y}));
  if(coord.x < state.cols-1)
    indices.push(exports.coordToIndex(state, {x:coord.x+1, y:coord.y}));
  if(coord.y > 0)
    indices.push(exports.coordToIndex(state, {x:coord.x, y:coord.y-1}));
  if(coord.y < state.rows-1)
    indices.push(exports.coordToIndex(state, {x:coord.x, y:coord.y+1}));

  return indices;
}
exports.getMirroredIndex = function(state, index) {
  var coord = exports.indexToCoord(state, index);
  var mirroredCoord = {x:state.cols-1-coord.x, y:state.rows-1-coord.y};
  var mirroredIndex = exports.coordToIndex(state, mirroredCoord);
  if(mirroredIndex !== index) {
    return mirroredIndex;
  }
  else {
    return -1;
  }
}

exports.getCoord = function(state, coord) {
  var index = exports.coordToIndex(state, coord);
  return state.grid[index];
}
exports.setCoord = function(state, coord, val) {
  var index = exports.coordToIndex(state, coord);
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}
exports.setIndex = function(state, index, val) {
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}

exports.showGrid = function(state) {
  for(var y=0; y<state.rows; y++) {
    var row = '';
    for(var x=0; x<state.cols; x++) {
      row += state.grid[exports.coordToIndex(state, {x:x,y:y})];
    }
    console.log(row+'\n');
  }
}

exports.makeEmptyGrid = function(rows, cols, key) {
  return Array(rows*cols+1).join(key);
}

exports.adjacent = function(state, index1, index2) {
  if(index1<state.grid.length && index2<state.grid.length && index1>=0 && index2>=0) {
    var coord1 = exports.indexToCoord(state, index1);
    var coord2 = exports.indexToCoord(state, index2);
    var horizontal = Math.abs(coord1.x-coord2.x);
    var vertical = Math.abs(coord1.y-coord2.y);
    if((horizontal<=distance.move && vertical===0) || (vertical<=distance.move && horizontal===0)) {
      return true;
    }
  }
  return false;
}

exports.indexToCoord = function(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return {x:x, y:y};
}

exports.coordToIndex = function(state, coord) {
  return state.cols * coord.y + coord.x;
}

exports.copyObj = function(object) {
  return JSON.parse(JSON.stringify(object));
}
