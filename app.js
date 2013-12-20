var fs = require('fs')
  , util = require('util')
  , game = require('./game.js')
  , http = require('http')
  , everyauth = require('everyauth')
  , express = require('express')
  , mongoose = require('mongoose')
  , path = require('path')
  , childProcess = require('child_process')
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
    res.render('index', {email:req.user.email});
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
            startBot(user.bot.lang, dir, processes);
            if(processes.length >= 2) startGame(processes, gameStore);
          });
        }
        else if(botName === 'nodebot') {
          startBot('node', nodeBot, processes);
          if(processes.length >= 2) startGame(processes, gameStore);
        }
        else if(botName === 'rubybot') {
          startBot('ruby', rubyBot, processes);
          if(processes.length >= 2) startGame(processes, gameStore);
        }
      });
    });
  });

  function startBot(lang, path, processes, failed) {
    console.log('starting ' + lang + ' bot: ' + path);
    var child = childProcess.exec(lang + ' ' + path, function (error, stdout, stderr) {
      if (error) {
        console.log('error starting ' + path);
        console.log('killing ' + processes.length + ' child processes');
        processes.forEach(function(p) {p.kill()});
        processes = [];
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
    processes.forEach(function(process) {
      process.kill();
      gameStarted = false;
      ready = 0;
      gameStore.save();
    });
  }, 2000);

  processes[0].stdin.write(JSON.stringify({player:'a', state:gameState})+'\n');
  processes[1].stdin.write(JSON.stringify({player:'b', state:gameState})+'\n');

  viewers.forEach(function(viewer) {
    viewer.emit('message', 'new');
    viewer.emit('game', gameState);
  });
  gameStore.turns.push(gameState);

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

        viewers.forEach(function(viewer) {
          viewer.emit('game', gameState);
        });
        gameStore.turns.push(gameState);

        if(gameState.winner) {
          console.log('GAME ENDED');
          if(gameState.winner) {
            if(gameState.winner == 'a')
              console.log('Client 1 wins');
            else if(gameState.winner == 'b')
              console.log('Client 2 wins');
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
