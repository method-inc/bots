var fs = require('fs');
var game = JSON.parse(fs.readFileSync('initial.json').toString());

function print_map(map) {
  console.log(map);
}

print_map(game.map);
