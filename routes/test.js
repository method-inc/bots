var express = require('express');
var router = express.Router();
var User = require('../models/index').User;
var isAuthenticated = require('./../middleware/is_authenticated');

router.get('/', isAuthenticated, function(req, res) {
  var sessionUser = req.session.auth.google.user;

  User.findOne({ where: { googleId: sessionUser.id } })
    .then(function(user, err) {
      var toSend = [];
      toSend.push({ name: 'nodebot' });
      toSend.push({ name: user.email });
      console.log('sending bots '+ toSend);
      res.render('test', {
        bots: toSend,
      });
  });
});

module.exports = router;
