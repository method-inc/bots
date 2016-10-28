var utils = require('../../game_logic/utils');
var fs = require('fs'),
   util = require('util'),
   http = require('http'),
   express = require('express'),
   app = express();

app.set('port', process.argv[2]);
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
app.get('/', function(req, res) {
  res.send('hello');
  res.end();
});

var server = http.createServer(app).listen(app.get('port'), function() {
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
    var adjacent = getAdjacentIndices(state, playerIndex);
    var to = adjacent[Math.floor(Math.random()*adjacent.length)];
    moves.push({ from: playerIndex, to: to });
  });

  return moves;
}
