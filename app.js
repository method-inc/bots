var fs = require('fs')
  , util = require('util')
  , game = require('./game.js')
  , net = require('net')
  , http = require('http')
  , https = require('https')
  , everyauth = require('everyauth')
  , express = require('express')
  , mongoose = require('mongoose')
  , path = require('path')
  , childProcess = require('child_process')
  , index = fs.readFileSync(__dirname + '/index.html')
  , nodeBot = __dirname + '/bots/nodebot.js'
  , rubyBot = __dirname + '/bots/rubybot.rb'
  , botsDir = __dirname + '/bots/'
  , app = express()
  , uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/aliens';

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret:'4J6YlRpJhFvgNmg',
  cookie: {maxAge:2*365*24*60*60*1000},
  store: new (require('express-sessions'))({
    storage: 'mongodb',
    instance: mongoose,
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    db: process.env.MONGO_DATABASE || 'aliens',
    collection: 'sessions',
    expire: 2*365*24*60*60*1000
  })
}));
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(uristring);

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

app.get('/', function(req, res) {
  res.render('index');
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  viewers.push(socket);
  sendBots();
  socket.on('start', function(data) {
    fs.readFile(botsDir+'bots.json', function(err, botData) {
      var currentBots = JSON.parse(botData);
      var bots = [];
      bots.push(currentBots[data.bot1]);
      bots.push(currentBots[data.bot2]);
      bots.forEach(function(bot) {
        if(bot.lang === 'js') {
          console.log('STARTING NODE BOT: ' + bot.name);
          childProcess.exec('node ' + bot.file, function (error, stdout, stderr) {
            if (error) {
              console.log(error.stack);
              console.log('Error code: '+error.code);
              console.log('Signal received: '+error.signal);
            }
          });
        }
        else if(bot.lang === 'rb') {
          console.log('STARTING RUBY BOT: ' + bot.name);
          childProcess.exec('ruby ' + bot.file, function (error, stdout, stderr) {
            if (error) {
              console.log(error.stack);
              console.log('Error code: '+error.code);
              console.log('Signal received: '+error.signal);
            }
          });
        }
      });
    });
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
