var gracketData = [];
var games = [];
var roundList = tournament.games;

empty = 0;
roundList.forEach(function(round) {
  roundArray = [];
  round.forEach(function(game) {
    games.push(game.id);
    var p1 = '';
    var p2 = '';
    var p1Id = '';
    var p2Id = '';
    if(game.p1) {
      p1 = game.p1;
      p1Id = game.p1.replace(/@|\./g, '');
    }
    else {
      p1Id = 'empty' + empty;
      empty++;
    }
    if(game.p2) {
      p2 = game.p2;
      p2Id = game.p2.replace(/@|\./g, '');
    }
    else {
      p2Id = 'empty' + empty;
      empty++;
    }

    roundArray.push([{name:p1, id:p1Id}, {name:p2, id:p2Id}]);
  });
  gracketData.push(roundArray);
});
if(tournament.winner) {
  gracketData.push([[{name: tournament.winner, id: tournament.winner.replace(/@|\./g, '')}]]);
}
else
  gracketData.push([[{name: '', id: 'empty'+empty}]]);

$(document).ready(function() {
  $('.bracket').gracket({src:gracketData});
  $('.g_game:not(.g_winner)').each(function(i) {
    $(this).wrap('<a href="/game/' + games[i] + '""></a>');
  });
  $('.bracket').draggable({axis:'x'});
});
