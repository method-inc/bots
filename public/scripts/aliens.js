var gameTurns = [];
var currentDisplayed = 0;
var turn = 0;
var socket = io.connect(window.location.hostname);
var c;
var ctx;
var turnSpeed = 1000;
var file;

window.onload = function() {
  c=document.getElementById('game');
  ctx=c.getContext('2d');

  filesUpload = $('#bot-file')[0];
  filesUpload.addEventListener('change', function(e) {
    var files = e.target.files || e.dataTransfer.files;
    if (files) {
      file = files[0];
      console.log('file changed');
      console.log(file);
    }
  }, false);

  turnSpeed = 1000-$('#turn-speed').val();
}

socket.on('message', function(data) {
  if(data === 'new') {
    resetGame();
  }
});
socket.on('game', function(data) {
  gameTurns.push(data);
  $('#turns').append('<li turn='+turn+'>'+turn+'</li>');
  showTurn(data);
  $('li.selected').removeClass('selected');
  $('li[turn='+turn+']').addClass('selected');
  currentDisplayed = turn;
  turn++;
});
socket.on('game-data', function(data) {
  console.log(data);
  $('#game-title').html(data.p1 + ' (red) vs. ' + data.p2 + ' (blue)');

  var winnerText = '';
  if(data.end === 'elegant') {
    if(data.winner) {
      winnerText = 'winner: ' + data.winner;
    }
    else {
      winnerText = 'tie'
    }
  }
  else {
    if(data.winner) {
      winnerText = 'winner: ' + data.winner + ' (' + data.end + ')';
    }
    else {
      winnerText = 'tie (' + data.end + ')';
    }
  }
  $('#game-winner').html(winnerText);
});
socket.on('bots', function(data) {
  $('#botlist1').html('');
  $('#botlist2').html('');
  data.forEach(function(bot) {
    $('#botlist1').append('<option value='+bot.name+'>'+bot.name+'</option>');
    $('#botlist2').append('<option value='+bot.name+'>'+bot.name+'</option>');
  });
});
socket.on('games', function(data) {
  $('#gamelist').html('');
  data.forEach(function(game) {
    $('#gamelist').append('<option value='+game.id+'>'+game.label+'</option>');
  });
});

$(document).on('click', 'li', function(e) {
  console.log('li clicked');
  var i = ~~$(this).attr('turn');
  showTurn(gameTurns[i]);
  currentDisplayed = i;
  $('li.selected').removeClass('selected');
  $('li[turn='+i+']').addClass('selected');
});
$(document).keydown(function(e) {
  if (e.keyCode === 37) {
    currentDisplayed--;
  }
  else if(e.keyCode === 39) {
    currentDisplayed++;
  }
  if(currentDisplayed < 0) currentDisplayed = 0;
  else if(currentDisplayed >= gameTurns.length && gameTurns.length) currentDisplayed = gameTurns.length-1;
  showTurn(gameTurns[currentDisplayed]);
  $('li.selected').removeClass('selected');
  $('li[turn='+currentDisplayed+']').addClass('selected');
});
$(document).on('click', '#bot-upload', function(e) {
  e.preventDefault();
  console.log('uploading bot');
  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      console.log('Sending file...');
      var buffer = e.target.result;
      socket.emit('send-file', file.name, buffer);
    };
    reader.readAsText(file);
  }
});
$(document).on('click', '#newgame', function(e) {
  e.preventDefault();
  var bot1 = $('#botlist1').val() || 0;
  var bot2 = $('#botlist2').val() || 0;
  socket.emit('start', {bot1:bot1,bot2:bot2});
});
$(document).on('click', '#showgame', function(e) {
  e.preventDefault();
  var gameId = $('#gamelist').val();
  socket.emit('show', {id:gameId});
});
$(document).on('click', '#animate-game', function(e) {
  if(gameTurns.length) {
    currentDisplayed = 0;
    animateNextTurn();
  }
});
$(document).on('change', '#turn-speed', function(e) {
  turnSpeed = 1000-$('#turn-speed').val();
});

function animateNextTurn() {
  setTimeout(function() {
    showTurn(gameTurns[currentDisplayed]);
    $('li.selected').removeClass('selected');
    $('li[turn='+currentDisplayed+']').addClass('selected');
    currentDisplayed++;
    if(currentDisplayed >= gameTurns.length) {
      currentDisplayed = gameTurns.length-1;
    }
    else {
      animateNextTurn();
    }
  }, turnSpeed);
}

function resetGame() {
  gameTurns = [];
  currentDisplayed = 0;
  turn = 0;
  $('#turns li').remove();
  ctx.clearRect (0, 0, c.width, c.height);
}

function showTurn(state) {
  ctx.clearRect (0, 0, c.width, c.height);
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
    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.rect(p1Spawn.x*coordWidth, p1Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }
  if(!state.p2.spawnDisabled) {
    var p2Spawn = indexToCoord(state, state.p2.spawn);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.25)';
    ctx.rect(p2Spawn.x*coordWidth, p2Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }

  for(var i=0; i<state.grid.length; i++) {
    var gridId = state.grid[i];
    if(gridId !== '.') {
      var coord = indexToCoord(state, i);
      var x = coord.x*coordWidth + coordWidth/2;
      var y = coord.y*coordHeight + coordHeight/2;

      switch(gridId) {
        case 'a':
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          break;
        case 'b':
          ctx.fillStyle = 'blue';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          break;
        case '*':
          ctx.fillStyle = 'brown';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/4, 0, 2*Math.PI);
          ctx.fill();
          break;
        case 'x':
          ctx.fillStyle = 'grey';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(x-coordWidth/4, y-coordWidth/4);
          ctx.lineTo(x+coordWidth/4, y+coordWidth/4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x-coordWidth/4, y+coordWidth/4);
          ctx.lineTo(x+coordWidth/4, y-coordWidth/4);
          ctx.stroke();
          break;
        default:
          console.log(gridId);
      }
    }
  }
}

function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return {x:x, y:y};
}