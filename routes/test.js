var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  if(!process.env.HEROKU) {
    res.render('test');
  }
  else {
    res.redirect('/');
  }
});

module.exports = router;