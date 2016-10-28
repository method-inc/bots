var game = require('./game');
var request = require('request');
var testBot = require('./test_bot');
var utils = require('./utils');

module.exports = function startGame(botUrls, gameStore, cb, sendTurn) {
  var newState = game.create(20, 20, 200);
  var gameState = utils.buildGameState(newState);

  var playerOptions = {
    p1Options: {
      url: botUrls[0],
      method: 'POST',
      form: {},
      timeout: 5000,
    },
    p2Options: {
      url: botUrls[1],
      method: 'POST',
      form: {},
      timeout: 5000,
    },
  };

  gameStore.playerOptions = playerOptions;

  gameState.save().then(function(savedState) {
    gameStore.save().then(function(savedGameStore) {
      savedState.setGame(savedGameStore).then(function() {
        nextTurn(savedGameStore, savedState, cb, sendTurn);
      });
    });
  });
};

function endGameForError(game, playerName, playerError, playerWinner, err, cb) {
  utils.log('PLAYER ' + playerName + ' ERROR: ' + err);
  game.end = playerError + ' bot error';
  game.winner = playerWinner;
  game.finished = true;
  game.finishedAt = Date.now();
  gameStarted = false;
  ready = 0;
  game.save().then(function() {
    if (cb) {
      cb();
    }
  });
}

function nextTurn(gameStore, gameState, cb, sendTurn) {
  var p1Moves = null;
  var p2Moves = null;
  var p1Options = gameStore.playerOptions.p1Options;
  var p2Options = gameStore.playerOptions.p2Options;

  p1Options.form.data = utils.stringifyGameState('r', gameState);
  p2Options.form.data = utils.stringifyGameState('b', gameState);

  function playerResponse(body) {
    if (p1Moves && p2Moves) {
      evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn);
    }
  }

  if (p1Options.url === 'nodebot') {
    p1Moves = testBot(p1Options.form.data);
    playerResponse();
  } else {
    request(p1Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 1 received data: ' + body);
        p1Moves = utils.tryParse(body);
        playerResponse();
      } else {
        endGameForError(gameStore, 'ONE', gameStore.p1, gameStore.p2, err, cb);
      }
    });
  }

  if (p2Options.url === 'nodebot') {
    p2Moves = testBot(p2Options.form.data);
    playerResponse();
  } else {
    request(p2Options, function(err, res, body) {
      if (!err) {
        utils.log('Player 2 received data: ' + body);
        p2Moves = utils.tryParse(body);
        playerResponse();
      } else {
        endGameForError(gameStore, 'TWO', gameStore.p2, gameStore.p1, err, cb);
      }
    });
  }
}

function detectGameComplete(gameStore, gameState, completeState, cb, sendTurn) {
  if (completeState.winner) {
    utils.log('GAME ENDED');
    if (completeState.winner) {
      if (completeState.winner === 'r') {
        utils.log('Client 1 wins');
        gameStore.winner = gameStore.p1;
      } else if (completeState.winner === 'b') {
        utils.log('Client 2 wins');
        gameStore.winner = gameStore.p2;
      }
      gameStore.finished = true;
      gameStore.finishedAt = Date.now();
    }
    gameStarted = false;
    ready = 0;
    gameStore.save().then(function(savedStore) {
      if (cb) {
        cb();
      }
    });
  } else {
    nextTurn(gameStore, completeState, cb, sendTurn);
  }
}

function evalMoves(gameStore, gameState, p1Moves, p2Moves, cb, sendTurn) {
  var newGameState = utils.buildGameState(game.doTurn(gameState, p1Moves, p2Moves));
  newGameState.save().then(function(savedState) {
    sendTurn(savedState);
    savedState.setGame(gameStore).then(function(completeState) {
      detectGameComplete(gameStore, gameState, completeState, cb, sendTurn);
    });
  });
}
