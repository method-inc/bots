var express = require('express');
var router = express.Router();
var models = require('./../models/index');
var Game = models.Game;
var User = models.User;
var Tournament = models.Tournament;

router.get('/', function(req, res) {
  req.session.prevpage = '/games';
  getGames(function(gamesList) {
    getTournaments(function(tournamentsList) {
      res.render('gameslist', { games: gamesList, tournaments: tournamentsList });
    });
  });
});

router.get('/:id', function(req, res) {
  Game.findOne({ where: { id: req.params.id } })
    .then(function(game, err) {
      if(!game) {
        res.redirect('/');
        return;
      }

      User.findAll({ where: { 'email': { $in: [game.p1, game.p2] } } })
        .then(function(users, err) {
          var players = getPlayers(game, users);

          game.getTurns({ order: ['turnsElapsed'] }).then(function(turns, err) {
            var prevpage = req.session.prevpage;
            req.session.prevpage = '';
            res.render('game', {
              id: req.params.id,
              p1: players.p1,
              p2: players.p2,
              winner: game.winner,
              prevpage: prevpage,
              turns: turns,
              description: getDescription(game),
            });
          });
      });
  });
});

function getGames(cb) {
  Game.findAll({ where: { finished: true }, order: [['finishedAt', 'DESC']] })
    .then(function(games, err) {
      if(!games.length) {
        if(cb) cb([]);
        return;
      }

      var gamesList = [];
      var completed = 0;
      games.forEach(function(game, i) {
        User.findAll({ where: { 'email': { $in: [game.p1, game.p2] } } })
          .then(function(users, err) {
            var p1 = 'nodebot';
            var p2 = 'nodebot';
            var description = '';

            if(users[0] && users[0].email === game.p1)
              p1 = users[0].name;
            if(users[0] && users[0].email === game.p2)
              p2 = users[0].name;

            if(users[1] && users[1].email === game.p1)
              p1 = users[1].name;
            else if (users[1] && users[1].email === game.p2)
              p2 = users[1].name;

            if(game.winner === game.p1) {
              description = p1 + ' defeated ' + p2;
            } else if(game.winner === game.p2) {
              description = p2 + ' defeated ' + p1;
            } else {
              description = 'Tie between ' + p1 + ' and ' + p2;
            }
            gamesList[i] = { id: game.id, description: description, time: game.finishedAt };
            completed++;

            if(completed===games.length) {
              if(cb) cb(gamesList);
            }
        });
      });
  });
}

function getTournaments(cb) {
  Tournament
  .findAll({ where: { winner: { $not: null } }, order: [['createdAt', 'DESC']] })
  .then(function(tournaments, err) {
    if(tournaments.length) {
      var tournamentsList = [];
      var completed = 0;
      tournaments.forEach(function(tournament, i) {
        User.findOne({ where: { 'email': tournament.winner } }).then(function(user, err) {
          var winner = 'nodebot';
          if(user && user.name) winner = user.name;
          var description = 'Winner: ' + winner;
          tournamentsList[i] =
            {
              id: tournament.id,
              description: description,
              time: tournament.createdAt,
            };
          completed++;

          if(completed===tournaments.length) {
            if(cb) cb(tournamentsList);
          }
        });
      });
    } else {
      if(cb)
        cb([]);
    }
  });
}

function getPlayers(game, users) {
  var p1 = { name: 'nodebot', picture: '/images/nodejs-icon.png' };
  var p2 = { name: 'nodebot', picture: '/images/nodejs-icon.png' };
  if(users[0]) {
    if(users[0].email === game.p1)
      p1 = { name: users[0].name, picture: users[0].picture };
    if(users[0].email === game.p2)
      p2 = { name: users[0].name, picture: users[0].picture };
  }
  if(users[1]) {
    if(users[1].email === game.p1)
      p1 = { name: users[1].name, picture: users[1].picture };
    else
      p2 = { name: users[1].name, picture: users[1].picture };
  }

  return { p1: p1, p2: p2 };
}

function getDescription(game) {
  if(!game.winner) {
    return '';
  }

  if(game.end === 'elegant') {
    return game.winner + ' wins';
  }
  return game.winner + ' wins (' + game.end + ')';
}

module.exports = router;
