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
var gameStarted = false;
var p1Moves = [];
var p2Moves = [];
var turns = 0;

var tcpServer = net.createServer(function(socket) {
  numberOfClients++;
  console.log('Client ' + numberOfClients + ' has connected');
  var client = new Client(socket);
  client.name = 'Client ' + numberOfClients;

  client.stream.on('data', function(data) {
    data = ''+data;
    if(gameStarted) {
      if(client.name === 'Client 1') {
        console.log('client 1 data');
        p1Moves = JSON.parse(data);
      }
      else if(client.name === 'Client 2') {
        console.log('client 2 data');
        p2Moves = JSON.parse(data);
      }

      if(p1Moves.length && p2Moves.length) {
        gameState = game.doTurn(gameState, p1Moves, p2Moves);
        turns++;

        clients.forEach(function(client) {
          p1Moves = [];
          p2Moves = [];
          client.stream.write(JSON.stringify(gameState)+'\n');
        });

        if(turns >= 20) {
          clients.forEach(function(client) {
            client.stream.end();
            gameStarted = false;
          });
        }
      }
    }
    else {
      if(data === 'ready') {
        clients.push(client);

        if(clients.length === 2) {
          gameState = game.create(20, 20);
          gameStarted = true;

          clients.forEach(function(client) {
            client.stream.write(JSON.stringify(gameState)+'\n');
          });
        }
      }
    }
  });

  client.stream.on('close', function() {
    console.log(client.name + ' disconnected');
    numberOfClients--;
    if(numberOfClients === 0) {
      tcpServer.close();
    }
  });

}).listen(1337, '127.0.0.1');
