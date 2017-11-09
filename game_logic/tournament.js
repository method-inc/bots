var models = require('./../models/index');
var User = models.User;
var startGame = require('./start_game');

module.exports = function nextGame(tournament, round, gameNum, test, sendTurn) {
  console.log('NEXT GAME');
  var now = new Date().valueOf();
  var scheduleDate = new Date(now + 100);
  tournament.nextGame = { time: scheduleDate, round: round, game: gameNum };
  tournament.save().then(function (savedTournament) {

    savedTournament.getGames({
      where: { round: round },
      order: ['Game.id'],
      include: [{ model: User, as: 'p1' }, { model: User, as: 'p2' }]
    })
      .then(function (roundGames) {
        var game = roundGames[gameNum];

        if (!game) {
          console.log('Game does not exist');
          return;
        }
        console.log('game details: ' + game.id);
        if (game.p1 && game.p2) {
          if (!test) {
            var botUrls = [game.p1.bot, game.p2.bot];
            startGameWithUrls(botUrls, game);
          } else {
            startGameWithUrls(['nodebot', 'nodebot'], game);
          }

          function startGameWithUrls(botUrls, game) {
            startGame(botUrls, game, function () {
                var nextRound = round + 1;
                var nextGameNum = ~~(gameNum / 2);
                savedTournament.getGames({ where: { round: nextRound }, order: ['id'] })
                  .then(function (nextRoundGames) {
                    if (nextRoundGames.length !== 0) {
                      var nextRoundGame = nextRoundGames[nextGameNum];
                      var nextRoundPlayer = gameNum % 2 === 0 ? 1 : 0;
                      if (nextRoundPlayer) {
                        nextRoundGame.setP1(game[game.winner]);
                        nextRoundGames[nextGameNum].p1 = game[game.winner];
                      } else {
                        nextRoundGame.setP2(game[game.winner]);
                        nextRoundGames[nextGameNum].p2 = game[game.winner];
                      }
                      nextRoundGame.save().then(function (savedGame) {
                        gameNum++;
                        if (roundGames && roundGames.length === gameNum) {
                          gameNum = 0;
                          round++;
                        }
                        //nextGame(savedTournament, round, gameNum, test);
                      });

                    } else {
                      console.log('tournament done');
                      savedTournament.setWinner(game[game.winner]);
                    }
                  });
              }, sendTurn);
          }
        } else {
          console.log('p1 or p2 is missing');
          console.log(JSON.stringify(game, null, 4));
        }
      });
  });
}