var _ = require('underscore');
var assert = require('assert');
var game = require('../game.js');

describe('Game', function(){
  describe('#create()', function(){
    it('should properly initialize a game state', function(){
      var createdState = game.create(5,10);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:1, spawn:11},
        p2:{food:1, spawn:38},
        grid:'..................................................'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      createdState = game.create(6,4);
      testState = {
        rows:6,
        cols:4,
        p1:{food:1, spawn:5},
        p2:{food:1, spawn:18},
        grid:'........................'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });
  });

  describe('#doTurn()', function(){
    it('should spawn first aliens correctly', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:1, spawn:11},
        p2:{food:1, spawn:38},
        grid:'..................................................'
      };
      var createdState = game.doTurn(beginState, [], []);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

    });

    it('should move aliens according to valid commands', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };
      var p1Moves = [{from:11,to:10}];
      var p2Moves = [{from:38,to:28}];
      var createdState = game.doTurn(beginState, p1Moves, p2Moves);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..........a.................b.....................'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

    });

    it('should ignore invalid commands', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };
      var p1Moves = [{from:11,to:0}];
      var p2Moves = [{from:32,to:28}];
      var createdState = game.doTurn(beginState, p1Moves, p2Moves);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should conduct combat correctly', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.......................a............a.......b.....'
      };
      var p1Moves = [{from:23,to:33}, {from:36,to:35}];
      var p2Moves = [{from:44,to:34}];
      var createdState = game.doTurn(beginState, p1Moves, p2Moves);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.................................a.a..............'
      };

      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });
  });
});
