var models = require('../models/index');
var startGame = require('../game_logic/start_game');
var nextGame = require('../game_logic/tournament');
var Game = models.Game;
var User = models.User;
var Tournament = models.Tournament;

module.exports = function(socket) {
  socket.on('start', function(data) {
    var botUrls = [];

    socket.emit('message', 'new');

    var gameStore = Game.build();

    User.findOne({ where: { email: data.bot1 } })
      .then(function(p1, err) {
        if (p1 && p1.bot) {
          gameStore.setP1(p1);
          botUrls.push(p1.bot);
        } else {
          botUrls.push('nodebot');
        }

        if (botUrls.length >= 2) {
          startGame(botUrls, gameStore, sendTurns, sendTurn);
        }
      });

    User.findOne({ where: { email: data.bot2 } })
      .then(function (p2, err) {
        if (p2 && p2.bot) {
          gameStore.setP2(p2);
          botUrls.push(p2.bot);
        } else {
          botUrls.push('nodebot');
        }

        if (botUrls.length >= 2) {
          startGame(botUrls, gameStore, sendTurns, sendTurn);
        }
      });
  });

  socket.on('start-tournament-game', function(data) {
    var game;
    Game.findOne({ where: { id: data.id }, include: [{ model: Tournament }] }).then(function (foundGame) {
      game = foundGame;
      return foundGame.Tournament.getGames({ order: ['id'], where: { round: game.round }, attributes: ['id'] });
    }).then(function (orderedGames) {
      var ids = orderedGames.map(function (orderedGame) { return orderedGame.id; });
      var gameIndex = ids.indexOf(game.id);
      socket.emit('message', 'new');
      nextGame(game.Tournament, game.round, gameIndex, false, sendTurn);
    });
  });

  socket.on('show', function(data) {
    Game.findOne({ where: { id: data.id } })
      .then(function(game, err) {
      if (game) {
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

  function sendTurn(turn) {
    socket.emit('game', turn);

    if (turn.winner) {
      Game.findOne({ where: { id: turn.GameId }, include: [{ model: User, as: 'p1' }, { model: User, as: 'p2' }] })
        .then(function(game, err) {
          console.log('Game: ' + JSON.stringify(game));
          if (game) {
            socket.emit('game-data',
              { p1: game.p1, p2: game.p2, winner: game.winner, end: game.end }
            );
          }
        });
    }
  }

  function sendTurns() {
    Game.findOne({ where: { id: gameStore.id } })
      .then(function (game, err) {
        console.log('Game: ' + JSON.stringify(game));
        if (game) {
          socket.emit('game-data',
            { p1: game.p1, p2: game.p2, winner: game.winner, end: game.end }
          );
          game.getTurns({ order: ['turnsElapsed'] }).then(function (turns) {
            turns.forEach(function (turn) {
              socket.emit('game', turn);
            });
          });
        }
      });
  }
};
