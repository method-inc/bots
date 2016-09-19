var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

var md = require('node-markdown').Markdown;
var instructions = path.join(__dirname + '/../' +  'README.md');
var instructionData = '';
fs.readFile(instructions, function (err, data) {
  if (err) throw err;
  instructionData = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.loggedIn) {
    res.render('loggedout');
  }
  else {
    req.session.prevpage = '';
    var user = req.session.auth.google.user;
    res.render('index', {
      email:user.email,
      md: md,
      instructions: instructionData.toString()
    });
  }
});

module.exports = router;
