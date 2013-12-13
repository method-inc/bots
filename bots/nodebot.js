console.log('ready');

process.stdin.on('data', function(data) {
  var game = JSON.parse(data);
  moves = getMoves(game.state, game.player);
  console.log(JSON.stringify(moves));
});

function getMoves(state, player) {
  var food;
  var spawn;
  var enemyFood;
  var enemySpawn;
  var playerIndices;
  var enemyIndices;
  var moves = [];

  if(player === 'a') {
    food = state.p1.food;
    spawn = state.p1.spawn;
    enemyFood = state.p2.food;
    enemySpawn = state.p2.spawn;
    playerIndices = getAllIndices(state.grid, 'a');
    enemyIndices = getAllIndices(state.grid, 'b');
  }
  else {
    food = state.p2.food;
    spawn = state.p2.spawn;
    enemyFood = state.p1.food;
    enemySpawn = state.p1.spawn;
    playerIndices = getAllIndices(state.grid, 'b');
    enemyIndices = getAllIndices(state.grid, 'a');
  }

  playerIndices.forEach(function(playerIndex) {
    var adjacent = getAdjacentIndices(state, playerIndex);
    var to = adjacent[Math.floor(Math.random()*adjacent.length)];
    moves.push({from:playerIndex, to:to});
  })

  return moves;
}

function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return {x:x, y:y};
}
function coordToIndex(state, coord) {
  return state.cols * coord.y + coord.x;
}
function getAllIndices(grid, search) {
  var arr = [];
  if(search === '.') search = '\\.';
  var re = new RegExp(search, 'g');
  while (m = re.exec(grid)) {
    arr.push(m.index);
  }
  return arr;
}
function getAdjacentIndices(state, index) {
  var indices = [];
  var coord = indexToCoord(state, index);
  if(coord.x > 0)
    indices.push(coordToIndex(state, {x:coord.x-1, y:coord.y}));
  if(coord.x < state.cols-1)
    indices.push(coordToIndex(state, {x:coord.x+1, y:coord.y}));
  if(coord.y > 0)
    indices.push(coordToIndex(state, {x:coord.x, y:coord.y-1}));
  if(coord.y < state.rows-1)
    indices.push(coordToIndex(state, {x:coord.x, y:coord.y+1}));

  return indices;
}
