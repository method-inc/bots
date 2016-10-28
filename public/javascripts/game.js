var gameTurns = [];
if(typeof turns !== 'undefined') gameTurns = turns;
var currentDisplayed = 0;
var turn = 0;
var socket = io();
var c;
var ctx;
var turnSpeed = 100;
var energyImage;
var animating = false;

window.onload = function() {
  c=document.getElementById('game');
  ctx=c.getContext('2d');
  energyImage = new Image();
  energyImage.src = '/images/iconSprite.png';
  if(gameTurns.length) {
    currentDisplayed = gameTurns.length-1;
    showTurn(gameTurns[currentDisplayed]);
    updateRound();
  }
};

socket.on('message', function(data) {
  if(data === 'new') {
    resetGame();
  }
});
if(!gameTurns.length) {
  socket.on('game', function(data) {
    gameTurns.push(data);
    showTurn(data);
    currentDisplayed = turn;
    turn++;
    updateRound();
  });
}

$(document).keydown(function(e) {
  animating = false;
  if (e.keyCode === 37) {
    updateCurrentDisplayed(-1);
  } else if(e.keyCode === 39) {
    updateCurrentDisplayed(1);
  }
  updateRound();
});
$(document).on('click', '#animate-game', function(e) {
  if(gameTurns.length) {
    animating = !animating;
    if(animating) {
      currentDisplayed = 0;
      animateNextTurn();
    }
  }
});
$(document).on('click', '.forward', function(e) {
  animating = false;
  updateCurrentDisplayed(1);
  updateRound();
});
$(document).on('click', '.back', function(e) {
  animating = false;
  updateCurrentDisplayed(-1);
  updateRound();
});
$(document).on('click', '.beginning', function(e) {
  animating = false;
  currentDisplayed = 0;
  showTurn(gameTurns[currentDisplayed]);
  updateRound();
});
$(document).on('click', '.end', function(e) {
  animating = false;
  currentDisplayed = gameTurns.length-1;
  showTurn(gameTurns[currentDisplayed]);
  updateRound();
});

function animateNextTurn() {
  if(animating) {
    setTimeout(function() {
      showTurn(gameTurns[currentDisplayed]);
      updateRound();
      currentDisplayed++;
      if(currentDisplayed >= gameTurns.length) {
        currentDisplayed = gameTurns.length-1;
      } else {
        animateNextTurn();
      }
    }, turnSpeed);
  }
}

function updateRound() {
  $('#turn .current').html(currentDisplayed);
  if(gameTurns.length)
    $('#turn .total').html(gameTurns.length-1);
  else
    $('#turn .total').html(0);
}

function resetGame() {
  gameTurns = [];
  currentDisplayed = 0;
  turn = 0;
  ctx.clearRect(0, 0, c.width, c.height);
  updateRound();
}

function updateCurrentDisplayed(aChange) {
  currentDisplayed += aChange;

  if(currentDisplayed < 0) {
    currentDisplayed = 0;
  } else if(currentDisplayed >= gameTurns.length && gameTurns.length) {
    currentDisplayed = gameTurns.length-1;
  }

  showTurn(gameTurns[currentDisplayed]);
}

function showTurn(state) {
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'lightgrey';
  var coordWidth = c.width/state.cols;
  for(var i=1; i<state.cols; i++) {
    var x = i*coordWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }

  var coordHeight = c.height/state.rows;
  for(var i=1; i<state.rows; i++) {
    var y = i*coordHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }
  if(!state.p1.spawnDisabled) {
    var p1Spawn = indexToCoord(state, state.p1.spawn);
    ctx.fillStyle = 'rgba(242, 97, 64, 0.5)';
    ctx.beginPath();
    ctx.rect(p1Spawn.x*coordWidth, p1Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }
  if(!state.p2.spawnDisabled) {
    var p2Spawn = indexToCoord(state, state.p2.spawn);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(110, 161, 215, 0.5)';
    ctx.rect(p2Spawn.x*coordWidth, p2Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }

  var p1Headcount = 0;
  var p2Headcount = 0;
  for(var i=0; i<state.grid.length; i++) {
    var gridId = state.grid[i];
    if(gridId !== '.') {
      var coord = indexToCoord(state, i);
      var x = coord.x*coordWidth + coordWidth/2;
      var y = coord.y*coordHeight + coordHeight/2;

      switch(gridId) {
        case 'r':
          p1Headcount++;
          drawBot(x, y, coordWidth, '#F26140');
          break;
        case 'b':
          p2Headcount++;
          drawBot(x, y, coordWidth, '#6EA1D7');
          break;
        case '*':
          ctx.drawImage(
            energyImage,
            679,
            51,
            94,
            94,
            x-coordWidth / 2,
            y-coordHeight / 2,
            coordWidth,
            coordHeight
          );
          break;
        case 'x':
          drawBot(x, y, coordWidth, '#F26140');
          addMarkOut(x, y, coordWidth);
          break;
        case 'X':
          drawBot(x, y, coordWidth, '#6EA1D7');
          addMarkOut(x, y, coordWidth);
          break;
        default:
          console.log(gridId);
      }
    }
  }
  $('#p1 .headcount').html(p1Headcount);
  $('#p2 .headcount').html(p2Headcount);
  $('#p1 .energyconsumed').html(state.p1.energy);
  $('#p2 .energyconsumed').html(state.p2.energy);
}

function drawBot(x, y, coordWidth, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
    ctx.fill();
}

function addMarkOut(x, y, coordWidth) {
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x-coordWidth/4, y-coordWidth/4);
    ctx.lineTo(x+coordWidth/4, y+coordWidth/4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x-coordWidth/4, y+coordWidth/4);
    ctx.lineTo(x+coordWidth/4, y-coordWidth/4);
    ctx.stroke();
}

function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return { x: x, y: y };
}
