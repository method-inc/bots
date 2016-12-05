var models = require('../models/index');
var startGame = require('../game_logic/start_game');
var Game = models.Game;
var User = models.User;

module.exports = function(socket) {
  socket.on('start', function(data) {
    var botUrls = [];
    var gameStore = Game.build({
      p1: data.bot1,
      p2: data.bot2,
    });

    socket.emit('message', 'new');

    [data.bot1, data.bot2].forEach(function(botId) {
      User.findOne({ where: { id: botId } })
        .then(function(user, err) {
          if(user && user.bot) {
            botUrls.push(user.bot);
          } else {
            botUrls.push('nodebot');
          }

          if(botUrls.length >= 2) {
            startGame(botUrls, gameStore, sendTurns, sendTurn);
          }
        }
      );
    });

    function sendTurn(turn) {
      socket.emit('game', turn);
    }

    function sendTurns() {
      Game.findOne({ where: { id: gameStore.id } })
        .then(function(game, err) {
          console.log('Game: ' + JSON.stringify(game));
        if(game) {
          socket.emit('game-data',
            { p1: game.p1, p2: game.p2, winner: game.winner, end: game.end }
          );
          game.getTurns({ order: ['turnsElapsed'] }).then(function(turns) {
            turns.forEach(function(turn) {
              socket.emit('game', turn);
            });
          });
        }
      });
    }
  });

  socket.on('show', function(data) {
    Game.findOne({ where: { id: data.id } })
      .then(function(game, err) {
      if(game) {
        socket.emit('game-data',
          { p1: game.p1, p2: game.p2, winner: game.winner, end: game.end }
        );
        game.getTurns({ order: ['turnsElapsed'] }).then(function(turns) {
          turns.forEach(function(turn) {
            socket.emit('game', turn);
          });
        });
      }
    });
  });
};
