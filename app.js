var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var game = require('./game.js');
var net = require('net');

var numberOfClients = 0;
var clients = [];
function Client(stream) {
  this.name = null;
  this.stream = stream;
}

var gameState = {};

var tcpServer = net.createServer(function(socket) {
  numberOfClients++;
  console.log('Client ' + numberOfClients + ' has connected');
  var client = new Client(socket);
  client.name = 'Client ' + numberOfClients;

  client.stream.on('data', function(data) {
    console.log('Data received from ' + client.name + ': ' + data);
    data = ''+data;
    if(data === 'ready') {
      clients.push(client);

      if(clients.length === 2) {
        gameState = game.create();

        clients.forEach(function(client) {
          client.stream.write(JSON.stringify(gameState)+'\n');
        });
      }
    }
  });

  client.stream.on('close', function() {
    console.log(client.name + ' disconnected');
  });

}).listen(1337, '127.0.0.1');
