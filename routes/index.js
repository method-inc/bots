var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

var marked = require('marked');
var instructions = path.join(__dirname + '/../' + 'README.md');
var instructionData = '';
fs.readFile(instructions, function(err, data) {
  if (err) throw err;
  instructionData = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {
  req.session.prevpage = '';
  res.render('index', {
    md: marked,
    instructions: instructionData.toString(),
  });
});

router.get('/loggedout', function(req, res, next) {
  res.render('loggedout');
});

module.exports = router;
