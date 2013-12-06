var fs = require('fs');
var util = require('util');
var game = require('./game.js');
var net = require('net');
var http = require('http');
var https = require('https');
var childProcess = require('child_process');
var index = fs.readFileSync(__dirname + '/index.html');
var nodeBot = __dirname + '/bots/nodebot.js';
var rubyBot = __dirname + '/bots/rubybot.rb';
var botsDir = __dirname + '/bots/';
var port = process.env.PORT || 3000;

var numberOfClients = 0;
var clients = [];
var viewers = [];
function Client(stream) {
  this.name = null;
  this.stream = stream;
}

var gameState = {};
var gameStarted = false;
var p1Moves = null;
var p2Moves = null;
var turns = 0;

var tcpServer = net.createServer(function(socket) {
  if(numberOfClients < 2) {
    numberOfClients++;
    console.log('Client ' + numberOfClients + ' has connected');
    var client = new Client(socket);
    client.name = 'Client ' + numberOfClients;

    client.stream.on('data', function(data) {
      data = ''+data;
      if(gameStarted) {
        if(client.name === 'Client 1') {
          console.log('Client 1 data: ' + data);
          p1Moves = JSON.parse(data);
        }
        else if(client.name === 'Client 2') {
          console.log('Client 2 data: ' + data);
          p2Moves = JSON.parse(data);
        }

        if(p1Moves && p2Moves) {
          gameState = game.doTurn(gameState, p1Moves, p2Moves);
          turns++;

          p1Moves = null;
          p2Moves = null;
          clients[0].stream.write(JSON.stringify({player:'a', state:gameState})+'\n');
          clients[1].stream.write(JSON.stringify({player:'b', state:gameState})+'\n');

          viewers.forEach(function(viewer) {
            viewer.emit('game', gameState);
          });

          if(turns >= 20 || gameState.winner) {
            console.log('GAME ENDED');
            if(gameState.winner) {
              if(gameState.winner == 'a')
                console.log('Client 1 wins');
              else if(gameState.winner == 'b')
                console.log('Client 2 wins');
              else
                console.log('Tie');
            }
            else {
              console.log('Too many turns have elapsed; tie.')
            }
            clients.forEach(function(client) {
              client.stream.end();
              gameStarted = false;
              clients = [];
              turns = 0;
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

            clients[0].stream.write(JSON.stringify({player:'a', state:gameState})+'\n');
            clients[1].stream.write(JSON.stringify({player:'b', state:gameState})+'\n');

            viewers.forEach(function(viewer) {
              viewer.emit('message', 'new');
              viewer.emit('game', gameState);
            });
          }
        }
      }
    });

    client.stream.on('close', function() {
      console.log(client.name + ' disconnected');
      numberOfClients--;
    });
  }
}).listen(1337, '127.0.0.1');

var app = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
});
var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
  viewers.push(socket);
  sendBots();
  socket.on('start', function(data) {
    if(data === 'node ruby') {
      childProcess.exec('node ' + nodeBot, function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: '+error.code);
          console.log('Signal received: '+error.signal);
        }
      });
      childProcess.exec('ruby ' + rubyBot, function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: '+error.code);
          console.log('Signal received: '+error.signal);
        }
      });
    }
  });

  socket.on('newbot', function(botData) {
    if(botData.url.substr(0,5) === 'https') {
      https.get(botData.url, function(res) {
        saveBot(botData, res, function() {
          sendBots();
        });
      });
    }
    else {
      http.get(botData.url, function(res) {
        saveBot(botData, res, sendBots);
      });
    }
  });

  function sendBots() {
    fs.readFile(botsDir+'bots.json', function(err, data) {
      var currentBots = JSON.parse(data);
      var toSend = [];
      currentBots.forEach(function(bot, index) {
        toSend.push({name:bot.name, index:index});
      });
      socket.emit('bots', toSend);
    });
  }
});

function saveBot(botData, res, cb) {
  fs.readFile(botsDir+'bots.json', function(err, data) {
    var toWrite = '';
    var currentBots = JSON.parse(data);
    var newBotName = 'bot'+(currentBots.length+1);
    var file = botsDir+newBotName;
    res.on('data', function(chunk) {
      toWrite += chunk;
    });
    res.on('end', function() {
      fs.writeFile(file, toWrite, function() {
        var newBot = {file:file, lang:botData.lang, name:newBotName};
        currentBots.push(newBot);
        fs.writeFile(botsDir+'bots.json', JSON.stringify(currentBots), function() {
          console.log('bot successfully saved');
          cb();
        })
      })
    });
  });
}

app.listen(port);
