var models = require('../models/index');
var startGame = require('../game_logic/start_game');
var Game = models.Game;
var User = models.User;

module.exports = function (socket) {

  socket.on('start', function(data) {
    var bots = [];
    var botUrls = [];
    var failed = false;
    var gameStore = Game.build({
      p1: data.bot1,
      p2: data.bot2,
    });

    socket.emit('message', 'new');

    [data.bot1, data.bot2].forEach(function(botName) {
      User.findOne({ where: { email: botName } })
        .then(function(user, err) {
          if(user && user.bot) {
            botUrls.push(user.bot);
          } else {
            botUrls.push('http://localhost:1337');
          }

          if(botUrls.length >= 2) {
            startGame(botUrls, gameStore, sendTurns);
          }
        }
      );
    });

    function sendTurns() {
      Game.findOne({ where: { id: gameStore.id } })
        .then(function(game, err) {
          console.log('Game: ' + JSON.stringify(game));
        if(game) {
          socket.emit('game-data', {p1:game.p1, p2:game.p2, winner:game.winner, end:game.end});
          game.getTurns().then(function(turns) {
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
        socket.emit('game-data', {p1:game.p1, p2:game.p2, winner:game.winner, end:game.end});
        game.getTurns().then(function(turns) {
          turns.forEach(function(turn) {
            socket.emit('game', turn);
          });
        });
      }
    });
  });

  socket.on('getbots', function() {
    User.findAll({ where: { bot: { $ne: '' } } })
      .then(function(users, err) {
        var toSend = [];
        toSend.push({name:'nodebot'});
        users.forEach(function(user) {
          toSend.push({name:user.email});
        });
        console.log('sending bots '+ toSend);
        socket.emit('bots', toSend);
      });
  });
};