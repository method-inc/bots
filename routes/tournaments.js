var express = require('express');
var router = express.Router();
var models = require('./../models/index');
var startGame = require('../game_logic/start_game');
var Tournament = models.Tournament;
var Game = models.Game;

router.get('/', function(req, res) {
  if(!req.loggedIn) {
    res.redirect('/');
    return;
  }
  Tournament.findOne({
    order: [ [ 'createdAt', 'DESC' ] ]
  })
  .then(function(tournament, err) {
    if(tournament) {
      res.redirect('/tournaments/' + tournament.id);
    }
    else {
      res.redirect('/');
    }
  });
});

router.get('/:id', function(req, res) {
  if(!req.loggedIn) {
    res.redirect('/');
    return;
  }
  var prevpage = req.session.prevpage;
  if(prevpage === '/tournaments/' + req.params.id) prevpage = '/';
  req.session.prevpage = '/tournaments/' + req.params.id;
  Tournament.findOne({ include: { model: Game, order: [ 'round' ] }, where: { id: req.params.id } })
    .then(function(tournament, err) {
      if(tournament) {
        res.render('tournament', {tournament:tournament, prevpage:prevpage});
      }
      else {
        console.log('no tournaments');
        res.redirect('/');
      }
    });
});

router.get('/start', function(req, res) {
  organizeTournament();
  res.redirect('/');
});

router.get('/startdummy/:players', function(req, res) {
  organizeDummyTournament(req.user, req.params.players);
  res.redirect('/');
});

router.get('/:tournamentId/kickstart/:gameId', function(req, res) {
  Tournament.findOne({ where: { id: req.params.tournamentId} })
    .then(function(tournament, err) {
    if(!err && tournament) {
      GameStore.findOne({ where: { id: req.params.gameId } })
      .then(function(game, err) {
        if(!err && game) {
          tournament.getGames().then(function(games) {
            games.forEach(function(round, roundI) {
              round.forEach(function(match, matchI) {
                if(match.id === game.id) {
                  game.turns = [];
                  game.save(function() {
                    nextGame(tournament, roundI, matchI);
                  });
                }
              });
            });
          });
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
    }
  });
  res.redirect('/');
});

function organizeTournament() {
  User.find({bot: { $exists: true }, participating:true }, function(err, users) {
    var players = [];
    users.forEach(function(user) {
      players.push(user.email);
      user.participating = false;
      user.save();
    });
    players = shuffleArray(players);
    var round = 1;
    console.log('starting tournament with ' + players.length + ' players');
    if(players.length > 1) {
      var tournament = new Tournament();
      console.log(tournament.id);
      tournamentRound(tournament, round, players, []);
    }
  });
}
function organizeDummyTournament(user, numPlayers) {
  var players = [];
  for(var i=0; i<numPlayers; i++) {
    players.push('player '+i);
  }
  var round = 1;
  console.log('starting tournament with ' + players.length + ' players');
  if(players.length > 1) {
    var tournament = Tournament.build({}).save().then(function(savedTournament) {
      console.log(savedTournament.id);
      tournamentRound(savedTournament, round, players, [], true);
    });
  }
}
function tournamentRound(tournament, round, players, assigned, test) {
  if(players.length > 1) {
    var numPlayers = players.length;
    var eliminated = [];
    var highestPow2 = Math.pow(2, ~~log2(numPlayers));
    numPlaying = (numPlayers-highestPow2)*2;
    if(!numPlaying) numPlaying = numPlayers;

    for(var i=0; i<numPlaying-1; i+=2) {
      var newGame = Game.build({});
      var p1 = players[i];
      var p2 = players[i+1];
      if(assigned.indexOf(p1) === -1) {
        newGame.p1 = p1;
        assigned.push(p1);
      }
      if(assigned.indexOf(p2) === -1) {
        newGame.p2 = p2;
        assigned.push(p2);
      }
      newGame.round = round;
      newGame.save().then(function(savedGame) {
        savedGame.setTournament(tournament);
      });
      eliminated.push(players[i+1]);
    }
    eliminated.forEach(function(loser) {
      var i = players.indexOf(loser);
      players.splice(i, 1);
    });

    round++;
    tournamentRound(tournament, round, players, assigned, test);
  }
  else {
    setTimeout(function() {
      startTournament(tournament, test);
    }, 5000);
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
  nextGame(tournament, 0, 0, test);
}
function nextGame(tournament, round, gameNum, test) {
  console.log('NEXT GAME');
  var now = new Date().valueOf();
  var scheduleDate = new Date(now+100);
  tournament.nextGame = {time:scheduleDate, round:round, game:gameNum};
  tournament.save();

  tournament.getGames({ where: { round: round }, order: [ 'id' ] }).then(function(roundGames) {
    var game = roundGames[gameNum];

    if(!game) {
      console.log('Game does not exist');
      return;
    }
    console.log('game details: ' + game.id);
    if(game.p1 && game.p2) {
      if(!test) {
        var botUrls = ['', ''];
        var botsFound = 0;
        [game.p1, game.p2].forEach(function(email) {
          User.findOne({ where: { email:email } }).then(function(user, err) {
            if(user && user.bot) {
              if(email === game.p1) {
                botUrls[0] = user.bot.url;
                botsFound++;
              }
              else {
                botUrls[1] = user.bot.url;
                botsFound++;
              }

              if(botsFound === 2) startGameWithUrls(botUrls, game);
            }
          });
        });
      }
      else {
        startGameWithUrls([testBotUrl, testBotUrl], game);
      }

      function startGameWithUrls(botUrls, game) {
        startGame(botUrls, game, function() {
          var winner = game.winner;
          tournament.getGames().then(function(tournamentGames) {
            if(round+1 < tournamentGames.length) {
              var nextRound = round+1;
              var nextGameNum = ~~(gameNum/2);
              tournament.getGames({ where: { round: nextRound }, order: [ 'id' ] }).then(function(nextRoundGames) {
                var nextRoundGame = nextRoundGames[nextGameNum];
                var nextRoundPlayer = gameNum%2===0 ? 1 : 0;
                if(nextRoundPlayer) {
                  nextRoundGame.p1 = winner;
                  tournament.games[nextRound][nextGameNum].p1 = winner;
                }
                else {
                  nextRoundGame.p2 = winner;
                  tournament.games[nextRound][nextGameNum].p2 = winner;
                }
                nextRoundGame.save().then(function(savedGame) {
                  gameNum++;
                  if(roundGames && roundGames.length === gameNum) {
                    gameNum = 0;
                    round++;
                  }
                  nextGame(tournament, round, gameNum, test);
                });
                tournament.markModified('games');
                tournament.save();
              });
            }
            else {
              console.log('tournament done');
              tournament.winner = winner;
              tournament.save();
            }
          });
        });
      }
    }
    else {
      console.log('p1 or p2 is missing');
      console.log(JSON.stringify(game, null, 4));
    }
  });
}

module.exports = router;
