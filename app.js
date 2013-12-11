var fs = require('fs')
  , util = require('util')
  , game = require('./game.js')
  , net = require('net')
  , http = require('http')
  , everyauth = require('everyauth')
  , express = require('express')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , path = require('path')
  , childProcess = require('child_process')
  , siofu = require('socketio-file-upload')
  , nodeBot = __dirname + '/bots/nodebot.js'
  , rubyBot = __dirname + '/bots/rubybot.rb'
  , botsDir = __dirname + '/bots/'
  , app = express()
  , uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/aliens';

var usersById = {};
var nextUserId = 0;
var usersByGoogleId = {};

var User = mongoose.model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  bot: { type: String },
  googleId: { type: Number, required: true }
}));

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
app.use(siofu.router);

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
  var uploader = new siofu();
  uploader.dir = botsDir;
  uploader.listen(socket);
  uploader.on('saved', function(e) {
    User.findById(socket.handshake.session.auth.userId, function(err, user) {
      if(user) {
        user.bot = e.file.pathName;
        user.save(function() {
          sendBots();
        });
      }
    });
  });
  uploader.on('error', function(e) {
    console.log('error from uploader', e);
  });

  viewers.push(socket);
  sendBots();
  socket.on('start', function(data) {
    var bots = [];
    var processes = [];
    var failed = false;
    [data.bot1, data.bot2].forEach(function(botName) {
      var botPath = '';
      User.findOne({email:botName}, function(err, user) {
        if(user && user.botPath) {
          botPath = user.bot;
        }
        else if(botName === 'nodebot') {
          botPath = nodeBot;
        }
        else if(botName === 'rubybot') {
          botPath = rubyBot;
        }

        var ext = botPath.slice(-3);
        if(ext === '.js') {
          if(!failed) {
            console.log('STARTING NODE BOT: ' + botPath);
            var child = childProcess.exec('node ' + botPath, function (error, stdout, stderr) {
              if (error) {
                console.log('error starting ' + botPath);
                console.log('killing ' + processes.length + ' child processes');
                processes.forEach(function(p) {p.kill()});
                processes = [];
                failed = true;
              }
            });
            processes.push(child);
          }
        }
        else if(ext === '.rb') {
          if(!failed) {
            console.log('STARTING RUBY BOT: ' + botPath);
            var child = childProcess.exec('node ' + botPath, function (error, stdout, stderr) {
              if (error) {
                console.log('error starting ' + botPath);
                console.log('killing ' + processes.length + ' child processes');
                processes.forEach(function(p) {p.kill()});
                processes = [];
                failed = true;
              }
            });
            processes.push(child);
          }
        }
        else {
          console.log('invalid file or extension');
          console.log('killing ' + processes.length + ' child processes');
          processes.forEach(function(p) {p.kill()});
          processes = [];
          failed = true;
        }
      });
    });
  });

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
