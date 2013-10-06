var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var game = JSON.parse(fs.readFileSync('initial.json').toString());

function debug_print(o) {
  util.debug(util.inspect(o, false, 2, true));
}

function print_map(map) {
  debug_print(map);
  util.print('\n\nMap:\n');
  util.print('[ ');

  for (var i = 0; i < map.rows; i++) {
    for (j = 0; j < map.cols; j++) {
      util.print(map.data.charAt(j + i*map.cols) + ' ');
    }

    if (i < map.rows - 1)
      util.print('\n  ');
  }

  util.print(' ]');
}

print_map(game.map);
