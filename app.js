var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var game = JSON.parse(fs.readFileSync('initial.json').toString());

function debug_print(o) {
  util.debug(util.inspect(o, false, 2, true));
}


/**
 * . - land
 * ^ - player1 hive
 * # - player2 hive
 * a - player1 aliens
 * b - player2 aliens
 * * - food
 */ 
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


/**
 * RTS "turn"
 */ 
function iterate() {
  console.log('Iteration ' + game.turn + '\n===================================');

  // Send game state to players

  // Receive orders from players

  // Perform phases and update game state

  print_map(game.map);
  game.turn++;
}

/**
 * Any game terminiation criteria goes here
 */ 
function game_on() {
  var keep_playing = true;
  keep_playing = turn_exceeded();  
  return keep_playing;
}

function turn_exceeded() { return game.turn <= game.max_turns; }
function game_engine() { do iterate(); while (game_on()); }

game_engine();
