socket.on('game-data', function(data) {
  resetGame();
});

$(document).on('click', '#newgame', function(e) {
  e.preventDefault();
  var bot1 = $('#botlist1').val() || 0;
  var bot2 = $('#botlist2').val() || 0;
  socket.emit('start', { bot1: bot1, bot2: bot2 });
});
