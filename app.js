
/**
 * Module dependencies.
 */

var express = require('express')
  , user = require('./handlers/user_handler')
  , bot = require('./handlers/bot_handler')
  , http = require('http')
  , path = require('path')
  , models = require('./models');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// User methods
app.get(   '/users',         user.listUsers);
app.post(  '/users',         user.createUser);
app.get(   '/users/:userId', user.getUser);
app.put(   '/users/:userId', user.editUser);
app.delete('/users/:userId', user.deleteUser);

// Bot methods
app.get(   '/users/:userId/bots',        bot.listUserBots);
app.post(  '/users/:userId/bots',        bot.createBot);
app.get(   '/users/:userId/bots/:botId', bot.getBot);
app.put(   '/users/:userId/bots/:botId', bot.editBot);
app.delete('/users/:userId/bots/:botId', bot.deleteBot);

models
  .sequelize
  .sync()
  .complete(function(err) {
    if(err) throw err;
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
  });
