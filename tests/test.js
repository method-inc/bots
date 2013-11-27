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
      var createdState = game.doTurn(beginState, [], [], true);
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
      var createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
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
      var createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };
      p1Moves = [{begin:11,end:0}];
      p2Moves = [{from:38,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........',
        winner:'b'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........'
      };
      p1Moves = {from:11, to:3};
      p2Moves = [{from:38,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'...........a..........................b...........',
        winner:'b'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should kill aliens that move to the same position', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'........................a..........b..............'
      };
      var p1Moves = [{from:24,to:25}];
      var p2Moves = [{from:35,to:25}];
      var createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..................................................',
        winner:'.'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.......................a..b......a..b.............'
      };
      p1Moves = [{from:33,to:23}];
      p2Moves = [{from:26,to:27}, {from:36,to:26}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..........................bb......................',
        winner:'b'
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
      var createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.................................a.a..............',
        winner:'a'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'................ab......aba.........b.............'
      };
      createdState = game.doTurn(beginState, [], [], true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'........................a...........b.............'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'................ab......bab.......bab.........ab..'
      };
      createdState = game.doTurn(beginState, [], [], true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.................b......b.........b............b..',
        winner:'b'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should disable spawns when razed', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..........a.b........b............................'
      };
      var p1Moves = [];
      var p2Moves = [{from:12,to:11}, {from:21,to:20}];
      var createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11, spawnDisabled:true},
        p2:{food:0, spawn:38},
        grid:'...........b........b.............................',
        winner:'b'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should deal with food-gathering correctly', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'......................b*.b*a......................'
      };
      var createdState = game.doTurn(beginState, [], [], true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:1, spawn:38},
        grid:'......................b..b.a......................'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.............a.........*...b...................*..'
      };
      var p1Moves = [{from:13,to:23}];
      var p2Moves = [{from:27,to:37}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:1, spawn:38},
        grid:'.......................a.............b............'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should declare winners correctly', function() {
      var beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'a.................................................'
      };
      var createdState = game.doTurn(beginState, [], [], true);
      var testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'a.................................................',
        winner:'a'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'b.................................................'
      };
      createdState = game.doTurn(beginState, [], [], true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'b.................................................',
        winner:'b'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..................................................'
      };
      createdState = game.doTurn(beginState, [], [], true);
      testState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'..................................................',
        winner:'.'
      };
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });
  });
});
