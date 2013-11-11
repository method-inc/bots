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

var server = net.createServer(function(socket) {
  number_of_clients++;
  console.log('Client ' + number_of_clients + ' has connected');
  var client = new Client(socket);
  client.name = 'Client ' + number_of_clients;
  clients.push(client);

  client.stream.on('data', function (data) {
    console.log('Data received from ' + client.name + ': ' + data);
    client.stream.write('Hello from the server!\n');
  });

}).listen(1337, '127.0.0.1');
