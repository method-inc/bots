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
    it('should properly initialize a game state for a 5x10 grid', function(){
      createdState = game.create(5,10);
      testState.p1.food = 1;
      testState.p2.food = 1;
      testState.grid = '..................................................';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should properly initialize a game state for a 6x4 grid', function(){
      createdState = game.create(6,4);
      testState.rows = 6;
      testState.cols = 4;
      testState.p1 = {food:1, spawn:5};
      testState.p2 = {food:1, spawn:18};
      testState.grid = '........................';
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

    it('should allow aliens to "swap" places', function() {
      p1Moves = [{from:11,to:12}, {from:12,to:11}];
      p2Moves = [{from:18,to:28}, {from:28,to:18}];
      beginState.grid = '...........aa.....b.........b.....................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '...........aa.....b.........b.....................';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should ignore commands to move to an invalid location', function() {
      p1Moves = [{from:11,to:0}];
      p2Moves = [{from:32,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should ignore commands without "to" and "from" properties', function() {
      p1Moves = [{begin:11,end:0}];
      p2Moves = [{from:38,to:28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should ignore commands that are not provided in an array', function() {
      p1Moves = {from:11, to:3};
      p2Moves = "[{from:38,to:28}]";
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.winner = '.';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should kill aliens of different teams that move to the same position', function() {
      beginState.grid = '........................a..........b..............';
      p1Moves = [{from:24,to:25}];
      p2Moves = [{from:35,to:25}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.........................x........................';
      testState.winner = '.';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should kill aliens of the same team that move to the same position', function() {
      beginState.grid = '.......................a..b......a..b.............'
      p1Moves = [{from:33,to:23}];
      p2Moves = [{from:26,to:27}, {from:36,to:26}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.......................x..bb......................';
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    })

    it('should conduct simple combat correctly', function() {
      beginState.grid = '.......................a............a.......b.....';
      p1Moves = [{from:23,to:33}, {from:36,to:35}];
      p2Moves = [{from:44,to:34}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.................................axa..............';
      testState.winner = 'a';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should conduct more complex combat correctly (1)', function() {
      beginState.grid = '................ab......aba.........b.............';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '................xx......axx.........b.............';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should conduct more complex combat correctly (2)', function() {
      beginState.grid = '................ab......bab.......bab.........ab..';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '................xb......bxx.......bxx.........xb..';
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should disable spawns when razed', function() {
      beginState.grid = '..........a.b........b............................';
      p2Moves = [{from:12,to:11}, {from:21,to:20}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..........xb........b.............................';
      testState.p1.spawnDisabled = true;
      testState.winner = 'b';
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should deal with food-gathering correctly (1)', function() {
      beginState.grid = '......................b*.b*a......................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '......................b..b.a......................';
      testState.p2.food = 1;
      assert.equal(JSON.stringify(createdState), JSON.stringify(testState));
    });

    it('should deal with food-gathering correctly (2)', function() {
      beginState.grid = '.............a.........*...b...................*..';
      p1Moves = [{from:13,to:23}];
      p2Moves = [{from:27,to:37}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.p2.food = 1;
      testState.grid = '.......................a.............b............';
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
