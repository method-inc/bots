var gridIds = {
  p1Spawn:'0',
  p2Spawn:'1',
  player1:'r',
  player2:'b',
  dead:'x',
  energy:'*',
  empty:'.'
};
var distance = {
  move:1,
  raze:1,
  attack:1,
  energy:0,
  spawn:1
};
var spawnFrequency = 3;

exports.create = function(rows, cols, maxTurns) {
  var gameState = {
    rows:rows,
    cols:cols,
    maxTurns:maxTurns || 20,
    turnsElapsed:0
  };

  gameState.p1 = {
    energy:1,
    spawn:coordToIndex(gameState, {x:1,y:1})
  };
  gameState.p2 = {
    energy:1,
    spawn:coordToIndex(gameState, {x:cols-2,y:rows-2})
  };
  gameState.grid = makeEmptyGrid(gameState.rows, gameState.cols);

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
  var re = new RegExp(gridIds.dead, 'g');
  state.grid = state.grid.replace(re, gridIds.empty);
  re = new RegExp(gridIds.player1+'|'+gridIds.player2, 'g');
  var newState = copyObj(state);
  newState.grid = newState.grid.replace(re, gridIds.empty);
  p1Moves.forEach(function(move) {
    if(adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player1) {
      setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        setIndex(newState, move.to, gridIds.dead);
      }
      else {
        setIndex(newState, move.to, gridIds.player1);
      }
    }
  });
  p2Moves.forEach(function(move) {
    if(adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player2) {
      setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        setIndex(newState, move.to, gridIds.dead);
      }
      else {
        setIndex(newState, move.to, gridIds.player2);
      }
    }
  });
  var unmovedP1s = getAllIndices(state.grid, gridIds.player1);
  var unmovedP2s = getAllIndices(state.grid, gridIds.player2);
  unmovedP1s.forEach(function(index) {
    if(newState.grid[index]===gridIds.player1 || newState.grid[index]===gridIds.player2) {
      setIndex(newState, index, gridIds.dead);
    }
    else {
      setIndex(newState, index, gridIds.player1);
    }
  });
  unmovedP2s.forEach(function(index) {
    if(newState.grid[index]===gridIds.player1 || newState.grid[index]===gridIds.player2) {
      setIndex(newState, index, gridIds.dead);
    }
    else {
      setIndex(newState, index, gridIds.player2);
    }
  });
  state = newState;

  // fight
  var p1Indices = getAllIndices(state.grid, gridIds.player1);
  var p2Indices = getAllIndices(state.grid, gridIds.player2);
  var battleData = {p1:{}, p2:{}};
  p1Indices.forEach(function(p1Index) {
    battleData.p1[p1Index] = 0;
    p2Indices.forEach(function(p2Index) {
      if(adjacent(state, p1Index, p2Index)) {
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

  var dead = [];
  p1Indices.forEach(function(p1Index) {
    var surroundingP1 = battleData.p1[p1Index];
    getAdjacentIndices(state, p1Index).forEach(function(adjIndex) {
      if(battleData.p2[adjIndex]) {
        var surroundingP2 = battleData.p2[adjIndex];
        if(surroundingP1 > surroundingP2) {
          if(dead.indexOf(p1Index) === -1)
            dead.push(p1Index);
        }
        else if(surroundingP1 === surroundingP2) {
          if(dead.indexOf(p1Index) === -1)
            dead.push(p1Index);
          if(dead.indexOf(adjIndex) === -1)
            dead.push(adjIndex);
        }
        else {
          if(dead.indexOf(adjIndex) === -1)
            dead.push(adjIndex);
        }
      }
    });
  });

  dead.forEach(function(index) {
    setIndex(state, index, gridIds.dead);
  })

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
    setIndex(state, state.p1.spawn, gridIds.player1);
  }
  if(!state.p2.spawnDisabled && state.p2.energy > 0 && state.grid[state.p2.spawn] === gridIds.empty) {
    state.p2.energy -= 1;
    setIndex(state, state.p2.spawn, gridIds.player2);
  }

  // gather
  var energy = getAllIndices(state.grid, '\\'+gridIds.energy);
  energy.forEach(function(energyIndex) {
    var surroundingP1 = 0;
    var surroundingP2 = 0;
    getAdjacentIndices(state, energyIndex).forEach(function(adjIndex) {
      if(state.grid[adjIndex]===gridIds.player1) {
        surroundingP1++;
      }
      else if(state.grid[adjIndex]===gridIds.player2) {
        surroundingP2++;
      }
    });
    if(surroundingP1 && surroundingP2) {
      setIndex(state, energyIndex, gridIds.empty);
    }
    else if(surroundingP1) {
      setIndex(state, energyIndex, gridIds.empty);
      state.p1.energy++;
    }
    else if(surroundingP2) {
      setIndex(state, energyIndex, gridIds.empty);
      state.p2.energy++;
    }
  });

  // spawn energy
  if(!testing && state.turnsElapsed%spawnFrequency===0) {
    var generateNum = state.rows*state.cols/50;
    var allEmptyIndices = getAllIndices(state.grid, gridIds.empty);
    var available = [];
    allEmptyIndices.forEach(function(index) {
      var mirrored = getMirroredIndex(state, index);
      if(mirrored >= 0) {
        if(allEmptyIndices.indexOf(mirrored) >= 0) {
          available.push(index);
        }
      }
    });
    if(available.length) {
      var randomIndex = available[Math.floor(Math.random()*available.length)];
      var mirroredIndex = getMirroredIndex(state, randomIndex);
      setIndex(state, randomIndex, gridIds.energy);
      setIndex(state, mirroredIndex, gridIds.energy);
    }
  }

  state.turnsElapsed++;

  // determine whether to continue/end game
  var numP1 = getAllIndices(state.grid, gridIds.player1).length;
  var numP2 = getAllIndices(state.grid, gridIds.player2).length;
  if(!numP1 && !numP2) state.winner = gridIds.empty;
  else if(!numP1) state.winner = gridIds.player2;
  else if(!numP2) state.winner = gridIds.player1;
  else if(state.turnsElapsed >= state.maxTurns) state.winner = gridIds.empty;

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
function getCoord(state, coord) {
  var index = coordToIndex(state, coord);
  return state.grid[index];
}
function setCoord(state, coord, val) {
  var index = coordToIndex(state, coord);
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}
function setIndex(state, index, val) {
  state.grid = state.grid.substr(0,index) + val + state.grid.substr(index+1);
}
function showGrid(state) {
  for(var y=0; y<state.rows; y++) {
    var row = '';
    for(var x=0; x<state.cols; x++) {
      row += state.grid[coordToIndex(state, {x:x,y:y})];
    }
    console.log(row+'\n');
  }
}
function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return {x:x, y:y};
}
function coordToIndex(state, coord) {
  return state.cols * coord.y + coord.x;
}
function makeEmptyGrid(rows, cols) {
  return Array(rows*cols+1).join(gridIds.empty);
}
function adjacent(state, index1, index2) {
  var coord1 = indexToCoord(state, index1);
  var coord2 = indexToCoord(state, index2);
  var horizontal = Math.abs(coord1.x-coord2.x);
  var vertical = Math.abs(coord1.y-coord2.y);
  if((horizontal<=distance.move && vertical===0) || (vertical<=distance.move && horizontal===0)) {
    return true;
  }
  return false;
}
function getAllIndices(grid, search) {
  var arr = [];
  if(search === '.') search = '\\.';
  var re = new RegExp(search, 'g');
  while (m = re.exec(grid)) {
    arr.push(m.index);
  }
  return arr;
}
function getAdjacentIndices(state, index) {
  var indices = [];
  var coord = indexToCoord(state, index);
  if(coord.x > 0)
    indices.push(coordToIndex(state, {x:coord.x-1, y:coord.y}));
  if(coord.x < state.cols-1)
    indices.push(coordToIndex(state, {x:coord.x+1, y:coord.y}));
  if(coord.y > 0)
    indices.push(coordToIndex(state, {x:coord.x, y:coord.y-1}));
  if(coord.y < state.rows-1)
    indices.push(coordToIndex(state, {x:coord.x, y:coord.y+1}));

  return indices;
}
function getMirroredIndex(state, index) {
  var coord = indexToCoord(state, index);
  var mirroredCoord = {x:state.cols-1-coord.x, y:state.rows-1-coord.y};
  var mirroredIndex = coordToIndex(state, mirroredCoord);
  if(mirroredIndex !== index) {
    return mirroredIndex;
  }
  else {
    return -1;
  }
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object)); 
}
