var net = require('net');

var HOST = '127.0.0.1';
var PORT = 1337;

var socket = new net.Socket();

socket.connect(PORT, HOST, function() {
  socket.write('ready');
});

socket.on('data', function(data) {
  var game = JSON.parse(data);
  console.log(JSON.stringify(game));
  socket.write('[{"from":0,"to":0}]')
});

socket.on('close', function() {
  console.log('Connection closed');
});