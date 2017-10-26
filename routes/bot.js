var express = require('express');
var router = express.Router();
var models = require('./../models/index');
var isAuthenticated = require('./../middleware/is_authenticated');

router.get('/', isAuthenticated, function(req, res) {
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

router.post('/', isAuthenticated, function(req, res) {
  var user = req.session.auth.google.user;
  models.User.update(
    { bot: req.body.url },
    { where: { googleId: user.id } }
  ).then(function() {
    res.redirect('/bot');
  });
});

router.post('/participate', isAuthenticated, function(req, res) {
  var user = req.session.auth.google.user;
  models.User.update(
    { participating: req.body.participating },
    { where: { googleId: user.id } }
  ).then(function() {
    res.redirect('/bot');
  });
});

module.exports = router;
