var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var game = JSON.parse(fs.readFileSync('initial.json').toString());

function debug_print(o) {
  util.debug(util.inspect(o, false, 2, true));
}

function print_map(map) {
  util.print('Map:\n');
  util.print('[ ');

  for (var i = 0; i < map.rows; i++) {
    for (j = 0; j < map.cols; j++) {
      util.print(map.data.charAt(j + i*map.cols) + ' ');
    }

    if (i < map.rows - 1)
      util.print('\n  ');
  }

  util.print(' ]\n\n');
}

function iterate() {
  console.log('Iteration ' + game.turn + '\n===================================');
  print_map(game.map);
  game.turn++;
}

function game_on() {
  var keep_playing = true;
  keep_playing = turn_exceeded();  
  return keep_playing;
}

function turn_exceeded() { return game.turn <= game.max_turns; }
function game_engine() { do iterate(); while (game_on()); }

game_engine();
