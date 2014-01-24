var fs = require('fs')
  , util = require('util')
  , http = require('http')
  , express = require('express')
  , app = express()

app.set('port', 1337);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.post('/', function(req, res) {
  var game = JSON.parse(req.body.data);
  var moves = getMoves(game.state, game.player);
  res.send(moves);
  res.end();
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

process.stdin.on('data', function(data) {
  var game = JSON.parse(data);
  moves = getMoves(game.state, game.player);
  console.log(JSON.stringify(moves));
});

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
    playerIndices = getAllIndices(state.grid, 'r');
    enemyIndices = getAllIndices(state.grid, 'b');
  }
  else {
    energy = state.p2.energy;
    spawn = state.p2.spawn;
    enemyenergy = state.p1.energy;
    enemySpawn = state.p1.spawn;
    playerIndices = getAllIndices(state.grid, 'b');
    enemyIndices = getAllIndices(state.grid, 'r');
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
