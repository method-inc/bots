var utils = require('../utils');

var gridIds = {
  p1Spawn:'0',
  p2Spawn:'1',
  player1:'r',
  player2:'b',
  dead1:'x',
  dead2:'X',
  energy:'*',
  empty:'.'
};

var spawnFrequency = 5;

exports.create = function(rows, cols, maxTurns) {
  var gameState = {
    rows:rows,
    cols:cols,
    maxTurns:maxTurns || 20,
    turnsElapsed:0
  };

  gameState.p1 = {
    energy:1,
    spawn:utils.coordToIndex(gameState, {x:1,y:1}),
    spawnDisabled: false,
  };
  gameState.p2 = {
    energy:1,
    spawn:utils.coordToIndex(gameState, {x:cols-2,y:rows-2}),
    spawnDisabled: false,
  };
  gameState.grid = utils.makeEmptyGrid(gameState.rows, gameState.cols, gridIds.empty);

  return gameState;
};

exports.doTurn = function(state, p1Moves, p2Moves, testing) {
  var p1Valid = validMoves(p1Moves);
  var p2Valid = validMoves(p2Moves);
  if(!p1Valid && !p2Valid) {
    state.winner = gridIds.empty;
    return state;
  }
  else if(!p1Valid) {
    state.winner = gridIds.player2;
    return state;
  }
  else if(!p2Valid) {
    state.winner = gridIds.player1;
    return state;
  }

  // move
  var re = new RegExp(gridIds.dead1, 'gi');
  state.grid = state.grid.replace(re, gridIds.empty);
  re = new RegExp(gridIds.player1+'|'+gridIds.player2, 'g');
  var newState = utils.copyObj(state);
  newState.grid = newState.grid.replace(re, gridIds.empty);
  p1Moves.forEach(function(move) {
    if(utils.adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player1) {
      utils.setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        utils.setIndex(newState, move.to, gridIds.dead1);
      }
      else {
        utils.setIndex(newState, move.to, gridIds.player1);
      }
    }
  });
  p2Moves.forEach(function(move) {
    if(utils.adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player2) {
      utils.setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        utils.setIndex(newState, move.to, gridIds.dead2);
      }
      else {
        utils.setIndex(newState, move.to, gridIds.player2);
      }
    }
  });
  var unmovedP1s = utils.getAllIndices(state.grid, gridIds.player1);
  var unmovedP2s = utils.getAllIndices(state.grid, gridIds.player2);
  unmovedP1s.forEach(function(index) {
    if(newState.grid[index]===gridIds.player1 || newState.grid[index]===gridIds.player2) {
      utils.setIndex(newState, index, gridIds.dead1);
    }
    else {
      utils.setIndex(newState, index, gridIds.player1);
    }
  });
  unmovedP2s.forEach(function(index) {
    if(newState.grid[index]===gridIds.player1 || newState.grid[index]===gridIds.player2) {
      utils.setIndex(newState, index, gridIds.dead2);
    }
    else {
      utils.setIndex(newState, index, gridIds.player2);
    }
  });
  state = newState;

  // fight
  var p1Indices = utils.getAllIndices(state.grid, gridIds.player1);
  var p2Indices = utils.getAllIndices(state.grid, gridIds.player2);
  var battleData = {p1:{}, p2:{}};
  p1Indices.forEach(function(p1Index) {
    battleData.p1[p1Index] = 0;
    p2Indices.forEach(function(p2Index) {
      if(utils.adjacent(state, p1Index, p2Index)) {
        battleData.p1[p1Index] += 1;
        if(battleData.p2[p2Index]) {
          battleData.p2[p2Index] += 1;
        }
        else {
          battleData.p2[p2Index] = 1;
        }
      }
    });
  });

  var dead1 = [];
  var dead2 = [];
  p1Indices.forEach(function(p1Index) {
    var surroundingP1 = battleData.p1[p1Index];
    utils.getAdjacentIndices(state, p1Index).forEach(function(adjIndex) {
      if(battleData.p2[adjIndex]) {
        var surroundingP2 = battleData.p2[adjIndex];
        if(surroundingP1 > surroundingP2) {
          if(dead1.indexOf(p1Index) === -1)
            dead1.push(p1Index);
        }
        else if(surroundingP1 === surroundingP2) {
          if(dead1.indexOf(p1Index) === -1)
            dead1.push(p1Index);
          if(dead2.indexOf(adjIndex) === -1)
            dead2.push(adjIndex);
        }
        else {
          if(dead2.indexOf(adjIndex) === -1)
            dead2.push(adjIndex);
        }
      }
    });
  });

  dead1.forEach(function(index) {
    utils.setIndex(state, index, gridIds.dead1);
  });

  dead2.forEach(function(index) {
    utils.setIndex(state, index, gridIds.dead2);
  });

  // raze
  if(state.grid[state.p1.spawn] === gridIds.player2) {
    state.p1.spawnDisabled = true;
  }
  if(state.grid[state.p2.spawn] === gridIds.player1) {
    state.p2.spawnDisabled = true;
  }

  // spawn
  if(!state.p1.spawnDisabled && state.p1.energy > 0 && state.grid[state.p1.spawn] === gridIds.empty) {
    state.p1.energy -= 1;
    utils.setIndex(state, state.p1.spawn, gridIds.player1);
  }
  if(!state.p2.spawnDisabled && state.p2.energy > 0 && state.grid[state.p2.spawn] === gridIds.empty) {
    state.p2.energy -= 1;
    utils.setIndex(state, state.p2.spawn, gridIds.player2);
  }

  // gather
  var energy = utils.getAllIndices(state.grid, '\\'+gridIds.energy);
  energy.forEach(function(energyIndex) {
    var surroundingP1 = 0;
    var surroundingP2 = 0;
    utils.getAdjacentIndices(state, energyIndex).forEach(function(adjIndex) {
      if(state.grid[adjIndex]===gridIds.player1) {
        surroundingP1++;
      }
      else if(state.grid[adjIndex]===gridIds.player2) {
        surroundingP2++;
      }
    });
    if(surroundingP1 && surroundingP2) {
      utils.setIndex(state, energyIndex, gridIds.empty);
    }
    else if(surroundingP1) {
      utils.setIndex(state, energyIndex, gridIds.empty);
      state.p1.energy++;
    }
    else if(surroundingP2) {
      utils.setIndex(state, energyIndex, gridIds.empty);
      state.p2.energy++;
    }
  });

  // spawn energy
  if(!testing && state.turnsElapsed%spawnFrequency===0) {
    var generateNum = state.rows*state.cols/50;
    var allEmptyIndices = utils.getAllIndices(state.grid, gridIds.empty);
    var available = [];
    allEmptyIndices.forEach(function(index) {
      var mirrored = utils.getMirroredIndex(state, index);
      if(mirrored >= 0) {
        if(allEmptyIndices.indexOf(mirrored) >= 0) {
          available.push(index);
        }
      }
    });
    if(available.length) {
      var randomIndex = available[Math.floor(Math.random()*available.length)];
      var mirroredIndex = utils.getMirroredIndex(state, randomIndex);
      utils.setIndex(state, randomIndex, gridIds.energy);
      utils.setIndex(state, mirroredIndex, gridIds.energy);
    }
  }

  state.turnsElapsed++;

  // determine whether to continue/end game
  var numP1 = utils.getAllIndices(state.grid, gridIds.player1).length;
  var numP2 = utils.getAllIndices(state.grid, gridIds.player2).length;

  if(state.turnsElapsed >= state.maxTurns || !numP1 || !numP2) {
    if(numP1 > numP2) {
      state.winner = gridIds.player1;
    }
    else if(numP2 > numP1) {
      state.winner = gridIds.player2;
    }
    else {
      var i = ~~(Math.random()*2);
      if(i) state.winner = gridIds.player1;
      else state.winner = gridIds.player2;
    }
  }

  return state;
};

// movement functions
function validMoves(moves) {
  if(!Array.isArray(moves)) {
    return false;
  }
  var allMovesValid = true;
  moves.forEach(function(move) {
    if(typeof move.from !== 'number' || typeof move.to !== 'number') {
      allMovesValid = false;
    }
  });
  if(!allMovesValid)
    return false;
  return true;
}

// grid functions
