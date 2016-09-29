var express = require('express');
var router = express.Router();
var User = require('../models/index').User;

router.get('/', function(req, res) {
  if(!process.env.HEROKU) {
    var sessionUser = req.session.auth.google.user;

    User.findAll()
      .then(function(users, err) {
        var toSend = [];
        toSend.push({name:'nodebot'});

        users.forEach(function(user) {
          toSend.push({name:user.email});
          console.log('sending bots '+ toSend);
        });

        res.render('test', {
          bots: toSend
        });
      });
  }
  else {
    res.redirect('/');
  }
});

module.exports = router;