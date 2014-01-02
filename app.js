var fs = require('fs')
  , util = require('util')
  , game = require('./game.js')
  , http = require('http')
  , everyauth = require('everyauth')
  , express = require('express')
  , mongoose = require('mongoose')
  , path = require('path')
  , childProcess = require('child_process')
  , schedule = require('node-schedule')
  , nodeBot = __dirname + '/bots/nodebot.js'
  , rubyBot = __dirname + '/bots/rubybot.rb'
  , botsDir = __dirname + '/bots/'
  , User = require('./models/User.js')
  , GameStore = require('./models/Game.js')
  , app = express()
  , uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/aliens';

var usersById = {};
var nextUserId = 0;
var usersByGoogleId = {};
var admins = ['mbriesen@skookum.com'];

everyauth.everymodule
  .findUserById( function (req, id, callback) {
    User.findById(id, callback);
  });
everyauth.google
  .appId(process.env.GOOGLE_APP_ID || '3335216477.apps.googleusercontent.com')
  .appSecret(process.env.GOOGLE_APP_SECRET || 'PJMW_uP39nogdu0WpBuqMhtB')
  .scope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
  .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    var promise = this.Promise();
    User.findOne({googleId:googleUser.id}, function(err, user) {
      if(!user) {
        user = new User();
        user.googleId = googleUser.id;
        user.email = googleUser.email;
        user.name = googleUser.name;
        user.save(function(err) {
          if(err) throw err;
          promise.fulfill(user);
        });
      }
      else {
        promise.fulfill(user);
      }
      return promise.fulfill(user);
    });
    return promise;
  })
  .redirectPath('/');

var sessionStore = new (require('express-sessions'))({
    storage: 'mongodb',
    instance: mongoose,
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    db: process.env.MONGO_DATABASE || 'aliens',
    collection: 'sessions',
    expire: 2*365*24*60*60*1000
  });
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret:'4J6YlRpJhFvgNmg',
  cookie: {maxAge:2*365*24*60*60*1000},
  store: sessionStore
}));
app.use(everyauth.middleware(app));
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(uristring);

app.get('/', function(req, res) {
  if(!req.user) {
    res.redirect('/auth/google');
  }
  else {
    var isAdmin = false;
    if(admins.indexOf(req.user.email) !== -1) isAdmin = true;
    res.render('index', {email:req.user.email, admin:isAdmin});
  }
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var viewers = [];
var io = require('socket.io').listen(server);
io.set('authorization', function (data, accept) {
  var sid = parseSessionCookie(data.headers.cookie, 'connect.sid', '4J6YlRpJhFvgNmg');
  if (sid) {
    sessionStore.get(sid, function(err, session) {
      if (err || !session) {
        accept('Error', false);
      } else {
        data.session = session;
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});
io.sockets.on('connection', function (socket) {
  socket.on('send-file', function(name, bot) {
    User.findById(socket.handshake.session.auth.userId, function(err, user) {
      if(user) {
        user.bot = {};
        var ext = name.slice(-3);
        if(ext === '.js') {
          user.bot.lang = 'node';
        }
        else if(ext === '.rb') {
          user.bot.lang = 'ruby';
        }
        else {
          user.bot.lang = 'node';
        }
        user.bot.body = bot;
        console.log('user bot: ' + bot);
        user.save(function() {
          sendBots();
        });
      }
    });
  });

  viewers.push(socket);
  sendBots();
  sendGames();
  socket.on('start', function(data) {
    var bots = [];
    var processes = [];
    var failed = false;
    var gameStore = new GameStore();
    var fileNumber = 1;
    gameStore.p1 = data.bot1;
    gameStore.p2 = data.bot2;

    [data.bot1, data.bot2].forEach(function(botName) {
      User.findOne({email:botName}, function(err, user) {
        if(user && user.bot) {
          var dir = botsDir + 'user'+fileNumber;
          fileNumber++;
          fs.writeFile(dir, user.bot.body, function(err) {
            console.log('bot saved to ' + dir);
            startBot(user.bot.lang, dir, processes, gameStore, botName);
            if(processes.length >= 2) startGame(processes, gameStore);
          });
        }
        else if(botName === 'nodebot') {
          startBot('node', nodeBot, processes, gameStore, botName);
          if(processes.length >= 2) startGame(processes, gameStore);
        }
        else if(botName === 'rubybot') {
          startBot('ruby', rubyBot, processes, gameStore, botName);
          if(processes.length >= 2) startGame(processes, gameStore);
        }
      });
    });
  });

  socket.on('show', function(data) {
    socket.emit('message', 'new');
    GameStore.findById(data.id, function(err, game) {
      if(game) {
        socket.emit('game-data', {p1:game.p1, p2:game.p2, winner:game.winner, end:game.end});
        game.turns.forEach(function(turn) {
          socket.emit('game', turn);
        });
      }
    });
  });

  socket.on('tournament', function() {
    User.find({bot: { $exists: true } }, 'email', function(err, users) {
      console.log('users playing:');
      console.log(users);
    });
  });

  function startBot(lang, path, processes, gameStore, bot) {
    console.log('starting ' + lang + ' bot: ' + path);
    var child = childProcess.exec(lang + ' ' + path, function (error, stdout, stderr) {
      if (error) {
        if(error.code === 143 || error.signal === 'SIGTERM') {
          console.log('bot did not crash');
        }
        else {
          console.log('bot crashed');
          gameStore.end = bot + ' crashed.';
          if(gameStore.p1 === bot) gameStore.winner = gameStore.p2;
          else gameStore.winner = gameStore.p1;
          gameStore.save();
          processes.forEach(function(p) {p.kill()});
          processes = [];
        }
      }
    });
    processes.push(child);
  }

  function sendBots() {
    User.find({bot: { $exists: true } }, function(err, users) {
      var toSend = [];
      toSend.push({name:'nodebot'});
      toSend.push({name:'rubybot'})
      users.forEach(function(user) {
        toSend.push({name:user.email});
      });
      socket.emit('bots', toSend);
    });
  }

  function sendGames() {
    GameStore
    .find({})
    .sort('-createdAt')
    .exec(function(err, games) {
      var toSend = [];
      games.forEach(function(game) {
        toSend.push({id:game.id, label:game.p1 + ' vs. ' + game.p2});
      });
      socket.emit('games', toSend);
    });
  }

  function startTournament() {
    var players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'];
    var round = 1;
    console.log('starting tournament with ' + players.length + ' players');
    tournamentRound(1, round, players);
  }
  function tournamentRound(tournament, round, players) {
    if(players.length > 1) {
      var numPlayers = players.length;
      var losers = [];
      var numPlaying = Math.pow(2, ~~log2(numPlayers));
      console.log('round ' + round + '. ' + numPlayers + ' players (' + numPlaying + ' playing).');
      for(var i=0; i<numPlaying-1; i+=2) {
        console.log(players[i] + ' vs. ' + players[i+1]);
        losers.push(players[i+1]); // change to actual loser of game later
      }
      losers.forEach(function(loser) {
        var i = players.indexOf(loser);
        players.splice(i, 1);
        console.log(loser + ' eliminated');
      });

      round++;
      tournamentRound(tournament, round, players);
    }
    else {
      console.log(players[0] + ' wins!');
    }
  }
  function log2(num) {
    return Math.log(num)/Math.log(2);
  }
});

function parseSessionCookie(cookie, sid, secret) {
  var cookies = require('express/node_modules/cookie').parse(cookie)
    , parsed = require('express/node_modules/connect/lib/utils').parseSignedCookies(cookies, secret);
  return parsed[sid] || null;
}

function startGame(processes, gameStore) {
  var gameState = game.create(20, 20, 100);
  var p1Moves = null;
  var p2Moves = null;
  var gameStarted = true;

  var timeout = setTimeout(function() {
    if(gameStore.end === 'elegant') {
      if(!p1Moves && !p2Moves) {
        gameStore.end = gameStore.p1 + ' and ' + gameStore.p2 + ' timeout';
      }
      else if(!p1Moves) {
        gameStore.end = gameStore.p1 + ' timeout';
        gameStore.winner = gameStore.p2;
      }
      else if(!p2Moves) {
        gameStore.end = gameStore.p2 + ' timeout';
        gameStore.winner = gameStore.p1;
      }
    }

    processes.forEach(function(process) {
      process.kill();
      gameStarted = false;
      ready = 0;
      gameStore.save();
    });
  }, 2000);

  processes[0].stdin.write(JSON.stringify({player:'a', state:gameState})+'\n');
  processes[1].stdin.write(JSON.stringify({player:'b', state:gameState})+'\n');

  gameStore.turns.push(gameState);
  gameStore.save();

  processes.forEach(function(process, index) {
    process.stdout.on('data', function(data) {
      data = (''+data).trim();
      console.log('data received: ' + data);
      if(index === 0) {
        p1Moves = JSON.parse(data);
      }
      else if(index === 1) {
        p2Moves = JSON.parse(data);
      }

      if(p1Moves && p2Moves && gameStarted) {
        clearTimeout(timeout);

        gameState = game.doTurn(gameState, p1Moves, p2Moves);

        gameStore.turns.push(gameState);
        gameStore.save();

        if(gameState.winner) {
          console.log('GAME ENDED');
          if(gameState.winner) {
            if(gameState.winner == 'a') {
              console.log('Client 1 wins');
              gameStore.winner = gameStore.p1;
            }
            else if(gameState.winner == 'b') {
              console.log('Client 2 wins');
              gameStore.winner = gameStore.p2;
            }
            else
              console.log('Tie');
          }
          processes.forEach(function(process) {
            process.kill();
            gameStarted = false;
            ready = 0;
            gameStore.save();
          });
        }
        else {
          p1Moves = null;
          p2Moves = null;
          processes[0].stdin.write(JSON.stringify({player:'a', state:gameState})+'\n');
          processes[1].stdin.write(JSON.stringify({player:'b', state:gameState})+'\n');

          timeout = setTimeout(function() {
            if(gameStore.end === 'elegant') {
              if(!p1Moves && !p2Moves) {
                gameStore.end = 'p1 and p2 timeout';
              }
              else if(!p1Moves) {
                gameStore.end = 'p1 timeout';
                gameStore.winner = gameStore.p2;
              }
              else if(!p2Moves) {
                gameStore.end = 'p2 timeout';
                gameStore.winner = gameStore.p1;
              }
            }

            processes.forEach(function(process) {
              process.kill();
              gameStarted = false;
              ready = 0;
              gameStore.save();
            });
          }, 2000);
        }
      }
    });
  });
}

var now = new Date().valueOf();
var runDate = new Date(now+30000);
console.log('start');
var task = schedule.scheduleJob(runDate, function() {
  console.log('thirty seconds after start');
});
