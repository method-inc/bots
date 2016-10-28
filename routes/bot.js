var express = require('express');
var router = express.Router();
var models = require('./../models/index');

router.get('/', function(req, res) {
  if(!req.loggedIn) {
    res.redirect('/');
    return;
  }

  var currentUrl = '';
  var sessionUser = req.session.auth.google.user;
  models.User.findOne({
    where: { googleId: sessionUser.id },
  }).then(function(user) {
    if (user.bot) {
      currentUrl = user.bot;
    }
    res.render('bot', { currentBotPath: currentUrl, participating: user.participating });
  });
});

router.post('/', function(req, res) {
  if(!req.loggedIn) {
    res.redirect('/');
    return;
  }

  var user = req.session.auth.google.user;
  models.User.update(
    { bot: req.body.url },
    { where: { googleId: user.id } }
  ).then(function() {
    res.redirect('/bot');
  });
});

router.post('/participate', function(req, res) {
  if(!req.loggedIn) {
    res.redirect('/');
    return;
  }

  var user = req.session.auth.google.user;
  models.User.update(
    { participating: req.body.participating },
    { where: { googleId: user.id } }
  ).then(function() {
    res.redirect('/bot');
  });
});

module.exports = router;
