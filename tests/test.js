var _ = require('underscore');
var assert = require('assert');
var game = require('../game.js');
var beginState = {};
var p1Moves = [];
var p2Moves = [];
var createdState = {};
var testState = {};

describe('Game', function(){
  beforeEach(function(done){
    beginState = {
      rows:5,
      cols:10,
      p1:{food:0, spawn:11},
      p2:{food:0, spawn:38},
      grid:'...........a..........................b...........'
    };
    p1Moves = [];
    p2Moves = [];
    createdState = {};
    testState = {
      rows:5,
      cols:10,
      p1:{food:0, spawn:11},
      p2:{food:0, spawn:38},
      grid:'...........a..........................b...........'
    };
    done();
  });
  describe('#create()', function(){
    it('should properly initialize a game state', function(){
      createdState = game.create(5,10);
      testState.p1.food = 1;
      testState.p2.food = 1;
      testState.grid = '..................................................';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      // put this into a separate test
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
      beginState.p1.food = 1;
      beginState.p2.food = 1;
      beginState.grid = '..................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should move aliens according to valid commands', function() {
      p1Moves = [{from:11,to:10}];
      p2Moves = [{from:38,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..........a.................b.....................';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should ignore invalid commands', function() {
      p1Moves = [{from:11,to:0}];
      p2Moves = [{from:32,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      // put these into separate tests
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
      beginState.grid = '........................a..........b..............';
      p1Moves = [{from:24,to:25}];
      p2Moves = [{from:35,to:25}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..................................................';
      testState.winner = '.';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      // put this into another test
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
      beginState.grid = '.......................a............a.......b.....';
      p1Moves = [{from:23,to:33}, {from:36,to:35}];
      p2Moves = [{from:44,to:34}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.................................a.a..............';
      testState.winner = 'a';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      // put these into another test
      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'................ab......aba.........b.............'
      };
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
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
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
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
      beginState.grid = '..........a.b........b............................';
      p2Moves = [{from:12,to:11}, {from:21,to:20}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '...........b........b.............................';
      testState.p1.spawnDisabled = true;
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should deal with food-gathering correctly', function() {
      beginState.grid = '......................b*.b*a......................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '......................b..b.a......................';
      testState.p2.food = 1;
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      // move this to another test
      beginState = {
        rows:5,
        cols:10,
        p1:{food:0, spawn:11},
        p2:{food:0, spawn:38},
        grid:'.............a.........*...b...................*..'
      };
      p1Moves = [{from:13,to:23}];
      p2Moves = [{from:27,to:37}];
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
      beginState.grid = 'a.................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = 'a.................................................';
      testState.winner = 'a';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState.grid = 'b.................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = 'b.................................................';
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));

      beginState.grid = '..................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..................................................';
      testState.winner = '.';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });
  });
});
