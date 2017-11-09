var express = require('express');
var router = express.Router();
var models = require('./../models/index');
var Game = models.Game;
var User = models.User;

router.get('/', function(req, res) {
  req.session.prevpage = '/games';
  getGames(function(gamesList) {
    res.render('games/index', { games: gamesList });
  });
});

router.get('/:id', function(req, res) {
  Game.findOne({
    where: { id: req.params.id },
    include: [{ model: User, as: 'p1' }, { model: User, as: 'p2' }],
  })
  .then(function(game, err) {
    if (!game) {
      res.redirect('/');
      return;
    }

    var players = {
      p1: getPlayer(game.p1, game.TournamentId),
      p2: getPlayer(game.p2, game.TournamentId),
    };

    game.getTurns({ order: ['turnsElapsed'] }).then(function(turns, err) {
      var prevpage = req.session.prevpage;
      req.session.prevpage = '';
      res.render('games/show', {
        id: req.params.id,
        p1: players.p1,
        p2: players.p2,
        winner: game.winner ? players[game.winner].name : '',
        prevpage: prevpage,
        turns: turns,
        description: getDescription(game, players),
        tournamentId: game.TournamentId,
      });
    });
  });
});

function getGames(cb) {
  Game.findAll({
    where: { finished: true },
    order: [['finishedAt', 'DESC']],
    include: [{ model: User, as: 'p1' }, { model: User, as: 'p2' }] })
    .then(function(games, err) {
      if (!games.length) {
        if (cb) cb([]);
        return;
      }

      var gamesList = [];
      var completed = 0;
      games.forEach(function(game, i) {
        var p1 = 'nodebot';
        var p2 = 'nodebot';
        var description = '';

        if (game.p1) {
          p1 = game.p1.name;
        }
        if (game.p2) {
          p2 = game.p2.name;
        }

        if (game.winner === 'p1') {
          description = p1 + ' defeated ' + p2;
        } else if (game.winner === 'p2') {
          description = p2 + ' defeated ' + p1;
        } else {
          description = 'Tie between ' + p1 + ' and ' + p2;
        }
        gamesList[i] = { id: game.id, description: description, time: game.finishedAt };
        completed++;

        if (completed===games.length) {
          if (cb) cb(gamesList);
        }
      });
  });
}

function getPlayer(user, isTournament) {
  if (!user) {
    var name = isTournament ? 'TBD' : 'nodebot';
    var picture = isTournament ? '' : '/images/nodejs-icon.png';
    return { name: name, picture: picture };
  }

  return { name: user.name, picture: user.picture };
}

function getDescription(game, players) {
  if (!game.winner) {
    return '';
  }

  if (game.end === 'elegant') {
    return players[game.winner].name + ' wins';
  }
  return players[game.winner].name + ' wins (' + game.end + ')';
}

module.exports = router;
