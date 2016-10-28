var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var everyauth = require('everyauth');
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);

var routes = require('./routes/index');
var bots = require('./routes/bot');
var test = require('./routes/test');
var games = require('./routes/games');
var tournaments = require('./routes/tournaments');

var models = require('./models/index');
models.Game.hasMany(models.Turn);
models.Turn.belongsTo(models.Game);
models.Tournament.hasMany(models.Game);
models.Game.belongsTo(models.Tournament);

var app = express();

require('./auth')(everyauth, models.User);

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
  secret: process.env.SESSION_SECRECT || 'test_secret',
  cookie: {secure: false},
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({db: models.sequelize}),
}))
.use(everyauth.middleware());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', routes);
app.use('/bot', bots);
app.use('/test/', test);
app.use('/games', games);
app.use('/tournaments', tournaments);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});


module.exports = app;
