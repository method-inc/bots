var express = require('express');
var router = express.Router();
var models = require('./../models/index');
var nextGame = require('./../game_logic/tournament');
var Tournament = models.Tournament;
var Game = models.Game;
var User = models.User;

router.get('/', function(req, res) {
  getTournaments(function(tournamentsList) {
    res.render('tournaments/index', { tournaments: tournamentsList });
  });
});

router.get('/:id', function(req, res) {
  var prevpage = req.session.prevpage;
  if (prevpage === '/tournaments/' + req.params.id) prevpage = '/';
  req.session.prevpage = '/tournaments/' + req.params.id;
  Tournament.findOne(
    {
      include: [
        {
        model: Game, order: ['round'], include: [
          { model: User, as: 'p1' }, { model: User, as: 'p2' }
        ]
      },{ model: User, as: 'winner' }
      ],
      where: { id: req.params.id }
    },
  ).then(function(tournament, err) {
      if (tournament) {
        res.render('tournaments/show', { tournament: tournament, prevpage: prevpage });
      } else {
        console.log('no tournaments');
        res.redirect('/');
      }
    });
});

router.get('/new/start', function(req, res) {
  organizeTournament(function(tournament) {
    res.redirect('/tournaments/' + tournament.id);
  });
});

router.get('/startdummy/:players', function(req, res) {
  organizeDummyTournament(req.user, req.params.players);
  res.redirect('/');
});

router.get('/:tournamentId/kickstart/:gameId', function(req, res) {
  Tournament.findOne({ where: { id: req.params.tournamentId } })
    .then(function(tournament, err) {
    if (!err && tournament) {
      Game.findOne({ where: { id: req.params.gameId } })
      .then(function(game, err) {
        if (!err && game) {
          tournament.getGames().then(function(games) {
            games.forEach(function(match, gameIndex) {
              if (match.id === game.id) {
                game.turns = [];
                game.save().then(function() {
                  nextGame(tournament, 1, gameIndex);
                });
              }
            });
          });
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
  res.redirect('/');
});

function getTournaments(cb) {
  Tournament.findAll({
    order: [['createdAt', 'DESC']],
    include: [ { model: User, as: 'winner'} ]
  }).then(function(tournaments, err) {
    if (tournaments.length) {
      var tournamentsList = [];
      var completed = 0;
      tournaments.forEach(function (tournament, i) {
        
          var winner = 'nodebot';
          if (tournament.winner && tournament.winner.name) winner = tournament.winner.name;
          var description = 'Winner: ' + winner;
          tournamentsList[i] =
            {
              id: tournament.id,
              description: description,
              time: tournament.createdAt,
            };
          completed++;

          if (completed===tournaments.length) {
            if (cb) cb(tournamentsList);
          }
      });
    } else {
      if (cb) {
        cb([]);
      }
    }
  });
}

function organizeTournament(callback) {
  User.findAll({ where: { participating: true } }).then(function(users, err) {
    var players = [];
    users.forEach(function(user) {
      players.push(user);
      //user.participating = false;
      //user.save();
    });
    players = shuffleArray(players);
    var round = 1;
    console.log('starting tournament with ' + players.length + ' players');
    if (players.length > 1) {
      Tournament.build({}).save().then(function(savedTournament) {
        console.log(savedTournament.id);
        tournamentRound(savedTournament, round, players, [], false, callback);
      });
    }
  });
}
function organizeDummyTournament(user, numPlayers) {
  var players = [];
  for (var i=0; i<numPlayers; i++) {
    players.push('player '+i);
  }
  var round = 1;
  console.log('starting tournament with ' + players.length + ' players');
  if (players.length > 1) {
    Tournament.build({}).save().then(function(savedTournament) {
      console.log(savedTournament.id);
      tournamentRound(savedTournament, round, players, [], true);
    });
  }
}
function tournamentRound(tournament, round, players, assigned, test, callback) {
  if (players.length > 1) {
    var numPlayers = players.length;
    var eliminated = [];
    var highestPow2 = Math.pow(2, ~~log2(numPlayers));
    numPlaying = (numPlayers-highestPow2)*2;
    if (!numPlaying) numPlaying = numPlayers;

    for (var i=0; i<numPlaying-1; i+=2) {
      
      var p1 = players[i];
      var p2 = players[i + 1];

      var gameP1, gameP2;

      if (assigned.indexOf(p1) === -1) {
        gameP1 = p1;
        assigned.push(p1);
      }
      if (assigned.indexOf(p2) === -1) {
        gameP2 = p2;
        assigned.push(p2);
      }
      var newGame = Game.build({
        round: round,
      });

      newGame.save().then(function(result) {
        return result.setP1(gameP1);
      }).then(function (result) {
        return result;
      }).then(function(result) {
        return result.setP2(gameP2);
      }).then(function(result) {
        return result.setTournament(tournament);
      });
      eliminated.push(players[i+1]);
    }
    eliminated.forEach(function(loser) {
      var i = players.indexOf(loser);
      players.splice(i, 1);
    });

    round++;
    tournamentRound(tournament, round, players, assigned, test, callback);
  }
  else {
    if (callback) {
      callback(tournament);
    }
    //setTimeout(function() {
    //  startTournament(tournament, test);
    //}, 5000);
  }
}
function log2(num) {
  return Math.log(num)/Math.log(2);
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function startTournament(tournament, test) {
  console.log('TOURNAMENT STARTED');
  nextGame(tournament, 1, 0, test);
}


module.exports = router;
