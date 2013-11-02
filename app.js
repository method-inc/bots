var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var game = JSON.parse(fs.readFileSync('initial.json').toString());
var net = require('net');

var number_of_clients = 0;
var clients = [];
function Client(stream) {
  this.name = null;
  this.stream = stream;
}

var server = net.createServer(function (socket) {
  // wait for two clients to connect
  //
  // send them game information
  //
  // wait for 'ready' response from both clients
  // they only have a limited amount of time to prepare
  //
  // once they are ready start iterating
  //
  // once game is over let the clients know what happened
  //

  number_of_clients++;
  console.log('Client ' + number_of_clients + ' has connected');
  var client = new Client(socket);
  client.name = 'Client ' + number_of_clients;
  clients.push(client);

  // Receive orders from players
  client.stream.on('data', function (data) {
    console.log('Data received from ' + client.name + ' ' + data);
    if (data.toString().trim() === 'ready') {
      console.log('Fight!');
      game_engine();
    }
    else {
      console.log(client.name + '\'s next moves are ' + data);
    }
  });

  if (number_of_clients == 2) {
    console.log('OK two bots have connected... sending game information');
    clients.forEach(function(c) {
      console.log('Writing game to client ' + c.name);
      c.stream.write(JSON.stringify(game) + '\n');
    });
  }

  /**
   * RTS "turn"
   */ 
  function iterate() {
    console.log('Iteration ' + game.turn + '\n===================================');

    // Send game state to players
    clients.forEach(function(c) {
      console.log('Writing game to client ' + c.name);
      c.stream.write(JSON.stringify(game) + '\n', function() {
        // Perform phases and update game state
        print_map(game.map);
      });
    });

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
  function game_engine() { 
    do iterate(); while (game_on()); 
    clients.forEach(function(c) {
      console.log('Ending game for client ' + c.name);
      c.stream.write('end' + '\n');
    });
  }

}).listen(1337, '127.0.0.1');

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

