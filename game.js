var gridIds = {
  p1Spawn:'0',
  p2Spawn:'1',
  player1:'a',
  player2:'b',
  food:'*',
  empty:'.'
};
var distance = {
  move:1,
  raze:1,
  attack:1,
  food:0,
  spawn:1
};

exports.create = function(rows, cols) {
  var gameState = {
    rows:rows,
    cols:cols
  };

  gameState.p1 = {
    food:1,
    spawn:coordToIndex(gameState, {x:1,y:1})
  };
  gameState.p2 = {
    food:1,
    spawn:coordToIndex(gameState, {x:cols-2,y:rows-2})
  };
  gameState.grid = makeEmptyGrid(gameState.rows, gameState.cols);

  return gameState;
};

exports.doTurn = function(state, p1Moves, p2Moves) {
  // move
  var re = new RegExp(gridIds.player1+'|'+gridIds.player2, 'g');
  var newState = copyObj(state);
  newState.grid = newState.grid.replace(re, gridIds.empty);
  p1Moves.forEach(function(move) {
    if(adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player1) {
      setIndex(newState, move.from, gridIds.empty);
      setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        setIndex(newState, move.to, gridIds.empty);
      }
      else {
        setIndex(newState, move.to, gridIds.player1);
      }
    }
  });
  p2Moves.forEach(function(move) {
    if(adjacent(state, move.to, move.from) && state.grid[move.from]===gridIds.player2) {
      setIndex(newState, move.from, gridIds.empty);
      setIndex(state, move.from, gridIds.empty);
      if(newState.grid[move.to]===gridIds.player1 || newState.grid[move.to]===gridIds.player2) {
        setIndex(newState, move.to, gridIds.empty);
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
      setIndex(newState, index, gridIds.empty);
    }
    else {
      setIndex(newState, index, gridIds.player1);
    }
  });
  unmovedP2s.forEach(function(index) {
    if(newState.grid[index]===gridIds.player1 || newState.grid[index]===gridIds.player2) {
      setIndex(newState, index, gridIds.empty);
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
    setIndex(state, index, gridIds.empty);
  })

  // raze
  if(state.grid[state.p1.spawn] === gridIds.player2) {
    state.p1.spawnDisabled = true;
  }
  if(state.grid[state.p2.spawn] === gridIds.player1) {
    state.p2.spawnDisabled = true;
  }

  // spawn
  if(!state.p1.spawnDisabled && state.p1.food > 0 && state.grid[state.p1.spawn] === gridIds.empty) {
    state.p1.food -= 1;
    setIndex(state, state.p1.spawn, gridIds.player1);
  }
  if(!state.p2.spawnDisabled && state.p2.food > 0 && state.grid[state.p2.spawn] === gridIds.empty) {
    state.p2.food -= 1;
    setIndex(state, state.p2.spawn, gridIds.player2);
  }

  // gather
  var food = getAllIndices(state.grid, '\\'+gridIds.food);
  food.forEach(function(foodIndex) {
    var surroundingP1 = 0;
    var surroundingP2 = 0;
    getAdjacentIndices(state, foodIndex).forEach(function(adjIndex) {
      if(state.grid[adjIndex]===gridIds.player1) {
        surroundingP1++;
      }
      else if(state.grid[adjIndex]===gridIds.player2) {
        surroundingP2++;
      }
    });
    if(surroundingP1 && surroundingP2) {
      setIndex(state, foodIndex, gridIds.empty);
    }
    else if(surroundingP1) {
      setIndex(state, foodIndex, gridIds.empty);
      state.p1.food++;
    }
    else if(surroundingP2) {
      setIndex(state, foodIndex, gridIds.empty);
      state.p2.food++;
    }
  });

  // determine whether to continue/end game
  var numP1 = getAllIndices(state.grid, gridIds.player1).length;
  var numP2 = getAllIndices(state.grid, gridIds.player2).length;
  if(!numP1 && !numP2) state.winner = gridIds.empty;
  else if(!numP1) state.winner = gridIds.player2;
  else if(!numP2) state.winner = gridIds.player1;

  return state;
};

// movement functions
function validMove(state, move, playerSymbol) {
  if(move.from<numCoords && move.from>=0
      && move.to<numCoords && move.to>=0
      && state.grid[move.from]===playerSymbol
      && state.grid[move.to]!==gridIds.p1Spawn
      && state.grid[move.to]!==gridIds.p2Spawn) {
    return true;
  }
  else {
    return false;
  }
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
  var re = new RegExp(search, 'g');
  while (m = re.exec(grid)) {
    arr.push(m.index);
  }
  return arr;
}
function getAdjacentIndices(state, index) {
  var indices = [];
  var coord = indexToCoord(state, index);
  indices.push(coordToIndex(state, {x:coord.x-1, y:coord.y}));
  indices.push(coordToIndex(state, {x:coord.x+1, y:coord.y}));
  indices.push(coordToIndex(state, {x:coord.x, y:coord.y-1}));
  indices.push(coordToIndex(state, {x:coord.x, y:coord.y+1}));

  return indices;
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object)); 
}
