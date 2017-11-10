var game = require('./game');
var request = require('request');
var testBot = require('./test_bot');
var utils = require('./utils');
var models = require('../models');
var Turn = models.Turn;

var turns = [];

module.exports = function startGame(botUrls, gameStore, cb, sendTurn) {
  var newState = game.create(20, 20, 200);
  var gameState = utils.buildGameState(newState);
  turns = [];
  var playerOptions = {
    p1Options: {
      url: botUrls[0],
      json: {},
      timeout: 5000,
    },
    p2Options: {
      url: botUrls[1],
      json: {},
      timeout: 5000,
    },
  };

  gameStore.playerOptions = playerOptions;

  gameStore.save().then(function(savedGame) {
    nextTurn(savedGame, gameState, cb, sendTurn);
  });
};

function endGameForError(game, playerName, playerError, playerWinner, err, cb, sendTurn) {
  utils.log('PLAYER ' + playerName + ' ERROR: ' + err);
  game.end = playerError + ' bot error';
  game.winner = playerWinner;
  game.finished = true;
  game.finishedAt = Date.now();
  saveGameAndTurns(game, cb);
  sendTurn({ GameId: game.id, winner: playerWinner });
}

function nextTurn(gameStore, gameState, cb, sendTurn) {
  var p1Moves = null;
  var p2Moves = null;
  var { p1Options, p2Options } = gameStore.playerOptions;

  p1Options.json = utils.stringifyGameState('r', gameState, gameStore.id);
  p2Options.json = utils.stringifyGameState('b', gameState, gameStore.id);

  function playerResponse(body) {
    if (p1Moves && p2Moves) {
      evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn);
    }
  }

  if (p1Options.url === 'nodebot') {
    p1Moves = testBot(p1Options.json);
    playerResponse();
  } else {
    request.post(p1Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 1 received data: ' + body);
        p1Moves = body;
        playerResponse(p1Moves);
      } else {
        if (gameStore.p1) {
          endGameForError(gameStore, 'ONE', gameStore.p1.name, 'p2', err, cb, sendTurn);
        } else {
          gameStore.getP1().then(function(p1) {
            endGameForError(gameStore, 'ONE', p1.name, 'p2', err, cb, sendTurn);
          });
        }
      }
    });
  }

  if (p2Options.url === 'nodebot') {
    p2Moves = testBot(p2Options.json);
    playerResponse();
  } else {
    request.post(p2Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 2 received data: ' + body);
        p2Moves = body;
        playerResponse();
      } else {
        endGameForError(gameStore, 'TWO', gameStore.p2.name, 'p1', err, cb, sendTurn);
      }
    });
  }
}

function detectGameComplete(gameStore, completeState, cb, sendTurn) {
  if (completeState.winner) {
    utils.log('GAME ENDED');
    if (completeState.winner) {
      if (completeState.winner === 'r') {
        utils.log('Client 1 wins');
        gameStore.winner = 'p1';
      } else if (completeState.winner === 'b') {
        utils.log('Client 2 wins');
        gameStore.winner = 'p2';
      }
      gameStore.finished = true;
      gameStore.finishedAt = Date.now();
    }
    if (sendTurn) {
      sendTurn(completeState);
    }
    saveGameAndTurns(gameStore, cb);
  } else {
    nextTurn(gameStore, completeState, cb, sendTurn);
  }
}

function evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn) {
  var newGameState = utils.buildGameState(game.doTurn(gameState, p1Moves, p2Moves));
  newGameState.GameId = gameStore.id;
  turns.push(utils.copyObj(newGameState));
  if (sendTurn && !newGameState.winner) {
    sendTurn(newGameState);
  }
  detectGameComplete(gameStore, newGameState, cb, sendTurn);
}

function saveGameAndTurns(game, cb) {
  game.save().then(function(savedStore) {
    Turn.bulkCreate(turns).then(function() {
      if (cb) {
        cb(savedStore);
      }
    });
  });
}
