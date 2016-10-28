var utils = require('../../game_logic/utils');
var http = require('http');
var express = require('express');
var app = express();

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

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

process.stdin.on('data', function(data) {
  var game = JSON.parse(data);
  moves = getMoves(game.state, game.player);
  console.log(JSON.stringify(moves));
});

function getMoves(state, player) {
  var playerIndices;
  var moves = [];

  if(player === 'r') {
    playerIndices = utils.getAllIndices(state.grid, 'r');
  } else {
    playerIndices = utils.getAllIndices(state.grid, 'b');
  }

  playerIndices.forEach(function(playerIndex) {
    var adjacent = getAdjacentIndices(state, playerIndex);
    var to = adjacent[Math.floor(Math.random()*adjacent.length)];
    moves.push({ from: playerIndex, to: to });
  });

  return moves;
}
