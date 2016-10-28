var assert = require('assert');
var game = require('../game_logic/game.js');
var beginState = {};
var p1Moves = [];
var p2Moves = [];
var createdState = {};
var testState = {};

describe('Game', function() {
  beforeEach(function(done) {
    beginState = {
      rows: 5,
      cols: 10,
      p1: {energy: 0, spawn: 11, spawnDisabled: false},
      p2: {energy: 0, spawn: 38, spawnDisabled: false},
      grid: '...........r..........................b...........',
      maxTurns: 20,
      turnsElapsed: 0,
    };
    p1Moves = [];
    p2Moves = [];
    createdState = {};
    testState = {
      rows: 5,
      cols: 10,
      p1: {energy: 0, spawn: 11, spawnDisabled: false},
      p2: {energy: 0, spawn: 38, spawnDisabled: false},
      grid: '...........r..........................b...........',
      maxTurns: 20,
      turnsElapsed: 1,
    };
    done();
  });
  describe('#create()', function() {
    it('should properly initialize a game state for a 5x10 grid', function() {
      createdState = game.create(5, 10);
      testState.p1.energy = 1;
      testState.p2.energy = 1;
      testState.grid = '..................................................';
      testState.turnsElapsed = 0;
      assert.deepEqual(createdState, testState);
    });

    it('should properly initialize a game state for a 6x4 grid', function() {
      createdState = game.create(6, 4, 30);
      testState.rows = 6;
      testState.cols = 4;
      testState.p1 = {energy: 1, spawn: 5, spawnDisabled: false};
      testState.p2 = {energy: 1, spawn: 18, spawnDisabled: false};
      testState.grid = '........................';
      testState.maxTurns = 30;
      testState.turnsElapsed = 0;
      assert.deepEqual(createdState, testState);
    });
  });

  describe('#doTurn()', function() {
    it('should spawn first aliens correctly', function() {
      beginState.p1.energy = 1;
      beginState.p2.energy = 1;
      beginState.grid = '..................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      assert.deepEqual(createdState, testState);
    });

    it('should move aliens according to valid commands', function() {
      p1Moves = [{from: 11, to: 10}];
      p2Moves = [{from: 38, to: 28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..........r.................b.....................';
      assert.deepEqual(createdState, testState);
    });

    it('should allow aliens to "swap" places', function() {
      p1Moves = [{from: 11, to: 12}, {from: 12, to: 11}];
      p2Moves = [{from: 18, to: 28}, {from: 28, to: 18}];
      beginState.grid = '...........rr.....b.........b.....................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '...........rr.....b.........b.....................';
      assert.deepEqual(createdState, testState);
    });

    it('should ignore commands to move to an invalid location', function() {
      p1Moves = [{from: 11, to: 0}];
      p2Moves = [{from: 32, to: 28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      assert.deepEqual(createdState, testState);
    });

    it('should ignore commands to move off the grid', function() {
      p1Moves = [{from: 49, to: 59}];
      beginState.grid = '.b...............................................r';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.b...............................................r';
      assert.deepEqual(createdState, testState);
    });

    it('should ignore commands without "to" and "from" properties', function() {
      p1Moves = [{begin: 11, end: 0}];
      p2Moves = [{from: 38, to: 28}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.winner = 'b';
      testState.turnsElapsed = 0;
      assert.deepEqual(createdState, testState);
    });

    it('should ignore commands that are not provided in an array', function() {
      p1Moves = {from: 11, to: 3};
      p2Moves = '[{from:38,to:28}]';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.winner = '.';
      testState.turnsElapsed = 0;
      assert.deepEqual(createdState, testState);
    });

    it('should kill aliens of different teams that move to the same position',
      function() {
        beginState.grid = 'r.......................r..........b..............';
        p1Moves = [{from: 24, to: 25}];
        p2Moves = [{from: 35, to: 25}];
        createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
        testState.grid = 'r........................X........................';
        testState.winner = 'r';
        assert.deepEqual(createdState, testState);
    });

    it('should kill aliens of the same team that move to the same position',
      function() {
        beginState.grid = '.......................r..b......r..b.............';
        p1Moves = [{from: 33, to: 23}];
        p2Moves = [{from: 26, to: 27}, {from: 36, to: 26}];
        createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
        testState.grid = '.......................x..bb......................';
        testState.winner = 'b';
        assert.deepEqual(createdState, testState);
    });

    it('should conduct simple combat correctly', function() {
      beginState.grid = '.......................r............r.......b.....';
      p1Moves = [{from: 23, to: 33}, {from: 36, to: 35}];
      p2Moves = [{from: 44, to: 34}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '.................................rXr..............';
      testState.winner = 'r';
      assert.deepEqual(createdState, testState);
    });

    it('should conduct more complex combat correctly (1)', function() {
      beginState.grid = '................rb......rbr.........b.............';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '................xX......rXx.........b.............';
      assert.deepEqual(createdState, testState);
    });

    it('should conduct more complex combat correctly (2)', function() {
      beginState.grid = '................rb......brb.......brb.........rb..';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '................xb......bxX.......bxX.........xb..';
      testState.winner = 'b';
      assert.deepEqual(createdState, testState);
    });

    it('should conduct more complex combat correctly (3)', function() {
      beginState.grid = '................r........rb........bb.............';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '................r........xX........bb.............';
      assert.deepEqual(createdState, testState);
    });

    it('should disable spawns when razed', function() {
      beginState.grid = '..........r.b........b............................';
      p2Moves = [{from: 12, to: 11}, {from: 21, to: 20}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '..........xb........b.............................';
      testState.p1.spawnDisabled = true;
      testState.winner = 'b';
      assert.deepEqual(createdState, testState);
    });

    it('should deal with energy-gathering correctly (1)', function() {
      beginState.grid = '......................b*.b*r......................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = '......................b..b.r......................';
      testState.p2.energy = 1;
      assert.deepEqual(createdState, testState);
    });

    it('should deal with energy-gathering correctly (2)', function() {
      beginState.grid = '.............r.........*...b...................*..';
      p1Moves = [{from: 13, to: 23}];
      p2Moves = [{from: 27, to: 37}];
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.p2.energy = 1;
      testState.grid = '.......................r.............b............';
      assert.deepEqual(createdState, testState);
    });

    it('should end the game after a certain number of turns have passed',
      function() {
        beginState.turnsElapsed = 19;
        testState.turnsElapsed = 20;
        createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
        assert.ok(createdState.winner);
    });

    it('should declare winners correctly', function() {
      beginState.grid = 'r.................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = 'r.................................................';
      testState.winner = 'r';
      assert.deepEqual(createdState, testState);

      beginState.grid = 'b.................................................';
      createdState = game.doTurn(beginState, p1Moves, p2Moves, true);
      testState.grid = 'b.................................................';
      testState.winner = 'b';
      assert.deepEqual(createdState, testState);
    });
  });
});
