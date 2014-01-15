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
  , Tournament = require('./models/Tournament.js')
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
        user.picture = googleUser.picture;
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
app.get('/history', function(req, res) {
  GameStore
    .find({finished:true})
    .sort('-finishedAt')
    .exec(function(err, games) {
      var gamesList = [];

      games.forEach(function(game, i) {
        User.find({
          'email': { $in: [game.p1, game.p2]}
        }, function(err, users) {
          var p1 = users[0].name;
          var p2 = users[1].name;
          var description = '';
          if(game.winner === game.p1) {
            description = p1 + ' defeated ' + p2;
          }
          else if(game.winner === game.p2) {
            description = p2 + ' defeated ' + p1;
          }
          else {
            description = 'Tie between ' + p1 + ' and ' + p2
          }
          gamesList.push(
            {
              id:game.id,
              description:description,
              time:game.finishedAt
            }
          );

          if(gamesList.length===games.length) {
            res.render('gameslist', {games:gamesList});
          }
        });
      });
    });
});
app.get('/game/:id', function(req, res) {
  GameStore.findById(req.params.id, function(err, game) {
    if(game) {
      User.find({
        'email': { $in: [game.p1, game.p2]}
      }, function(err, users) {
        var p1 = { name:users[0].name, picture:users[0].picture };
        var p2 = { name:users[1].name, picture:users[1].picture };
        res.render('game', {id:req.params.id, p1:p1, p2:p2, winner:game.winner});
      });
    }
    else {
      res.redirect('/history');
    }
  });
});
app.get('/tournament', function(req, res) {
  Tournament
    .findOne({})
    .sort('-createdAt')
    .exec(function(err, tournament) {
      if(tournament) {
        res.redirect('/tournament/'+tournament.id);
      }
      else {
        res.redirect('/');
      }
    });
});
app.get('/tournament/:id', function(req, res) {
  Tournament.findById(req.params.id, function(err, tournament) {
    if(tournament) {
      res.render('tournament', {tournament:tournament});
    }
    else {
      console.log('no tournament');
      res.redirect('/');
    }
  });
});
app.get('/bot', function(req, res) {
  res.render('bot')
});
app.get('/starttournament', function(req, res) {
  if(admins.indexOf(req.user.email) !== -1) {
    organizeTournament();
  }
  res.redirect('/');
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
          // confirm bot doesn't crash/timeout
          fs.writeFile(botsDir + 'test', user.bot.body, function(err) {
            var crashed = false;
            var child = childProcess.exec(user.bot.lang + ' ' + botsDir+'test', function (error, stdout, stderr) {
              if (error) {
                if(error.code === 143 || error.signal === 'SIGTERM') {
                  console.log('bot did not crash');
                }
                else {
                  socket.emit('crash', stderr);
                  crashed = true;
                  user.bot = undefined;
                  user.save();
                }
              }
            });
            child.stdin.write(JSON.stringify({player:'a', state:{rows:5,cols:10,p1:{food:0, spawn:11},p2:{food:0, spawn:38},grid:'...........a..........................b...........',maxTurns:20,turnsElapsed:0}})+'\n');
            
            var timeout = setTimeout(function() {
              child.kill();
              if(!crashed) {
                socket.emit('timeout');
                user.bot = undefined
                user.save();
              }
            }, 2000);
            child.stdout.on('data', function(data) {
              socket.emit('success');
              clearTimeout(timeout);
              child.kill();
            });
          });
        });
      }
    });
  });

  viewers.push(socket);

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
});

function parseSessionCookie(cookie, sid, secret) {
  var cookies = require('express/node_modules/cookie').parse(cookie)
    , parsed = require('express/node_modules/connect/lib/utils').parseSignedCookies(cookies, secret);
  return parsed[sid] || null;
}

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
function startGame(processes, gameStore, cb) {
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
    cb();
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
        gameStore.save(function() {
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
              else {
                console.log('Tie');
                gameStore.winner = gameStore.p1; // TEMPORARY, until we decide on how to resolve ties in tournaments
              }

              gameStore.finished = true;
              gameStore.finishedAt = Date.now();
            }
            processes.forEach(function(process) {
              process.kill();
              gameStarted = false;
              ready = 0;
              gameStore.save();
            });
            cb();
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
              cb();
            }, 2000);
          }
        });
      }
    });
  });
}

function organizeTournament() {
  User.find({bot: { $exists: true } }, function(err, users) {
    var players = [];
    users.forEach(function(user) {
      players.push(user.email);
    });
    var round = 1;
    console.log('starting tournament with ' + players.length + ' players');
    if(players.length > 1) {
      var tournament = new Tournament();
      console.log(tournament.id);
      tournamentRound(tournament, round, players, []);
    }
  });
}
function tournamentRound(tournament, round, players, assigned) {
  if(players.length > 1) {
    var numPlayers = players.length;
    var eliminated = [];
    var numPlaying = Math.pow(2, ~~log2(numPlayers));
    tournament.games[round-1] = [];
    for(var i=0; i<numPlaying-1; i+=2) {
      var newGame = new GameStore();
      var p1 = players[i];
      var p2 = players[i+1];
      if(assigned.indexOf(p1) === -1) {
        newGame.p1 = p1;
        assigned.push(p1);
      }
      if(assigned.indexOf(p2) === -1) {
        newGame.p2 = p2;
        assigned.push(p2);
      }
      newGame.save();
      tournament.games[round-1].push({id:newGame.id, p1:newGame.p1, p2:newGame.p2});
      tournament.save();
      eliminated.push(players[i+1]);
    }
    eliminated.forEach(function(loser) {
      var i = players.indexOf(loser);
      players.splice(i, 1);
    });

    round++;
    tournamentRound(tournament, round, players, assigned);
  }
  else {
    startTournament(tournament);
  }
}
function log2(num) {
  return Math.log(num)/Math.log(2);
}

function startTournament(tournament) {
  nextGame(tournament, 0, 0);
}
function nextGame(tournament, round, gameNum) {
  var now = new Date().valueOf();
  var scheduleDate = new Date(now+30000);
  tournament.nextGame = {time:scheduleDate, round:round, game:gameNum};
  tournament.save();

  var task = schedule.scheduleJob(scheduleDate, function() {
    var gameDetails = tournament.games[round][gameNum];
    GameStore.findById(gameDetails.id, function(err, game) {
      if(game) {
        if(game.p1 && game.p2) {
          var fileNumber = 1;
          var processes = [];
          [game.p1, game.p2].forEach(function(email) {
            User.findOne({email:email}, function(err, user) {
              if(user && user.bot) {
                var dir = botsDir + 'user'+fileNumber;
                fileNumber++;
                fs.writeFile(dir, user.bot.body, function(err) {
                  console.log('bot saved to ' + dir);
                  startBot(user.bot.lang, dir, processes, game, email);
                  if(processes.length >= 2) startGame(processes, game, function() {
                    var winner = game.winner;

                    if(round+1 < tournament.games.length) {
                      var nextRound = round+1;
                      var nextGameNum = ~~(gameNum/2);
                      var nextRoundGame = tournament.games[nextRound][nextGameNum];
                      var nextRoundPlayer = gameNum%2===0 ? 1 : 0;
                      GameStore.findById(nextRoundGame.id, function(err, game) {
                        if(nextRoundPlayer) {
                          game.p1 = winner;
                          tournament.games[nextRound][nextGameNum].p1 = winner;
                        }
                        else {
                          game.p2 = winner;
                          tournament.games[nextRound][nextGameNum].p2 = winner;
                        }
                        game.save();
                        tournament.markModified('games');
                        tournament.save();
                      });
                    }

                    gameNum++;
                    if(tournament.games[round].length === gameNum) {
                      gameNum = 0;
                      round++;
                    }
                    if(tournament.games.length === round) {
                      console.log('tournament done');
                      tournament.winner = winner;
                      tournament.save();
                    }
                    else {
                      nextGame(tournament, round, gameNum);
                    }
                  });
                });
              }
            });
          });
        }
        else {
          console.log('p1 or p2 is missing');
        }
      }
    });
  });
}
