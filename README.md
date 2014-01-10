aliens
======
After cloning the repo run `npm install`

In order to set up the server, run `node app.js` in your terminal.

Go to `http://localhost:3000` in your browser.

How to Play
--------
The field consists of a 20 by 20 unit grid. There are two spawn points at opposite corners for the red bot and blue bot. One unit for each player is spawned in the first turn. Energy is spawned randomly around the field every three turns. If a player's unit gathers energy (by moving adjacent to it), another unit will be spawned for that player at the next turn. Each unit of a player's color can be moved one space per turn (up, down, left, or right, so no diagonals). If a player submits turns in an invalid format, he/she will be disqualified. Invalid moves will be ignored.

The goal of the game is to eliminate all units of the opponent's color. If units of differing colors are adjacent after moving, a battle will commence. In the event of a battle, the unit with the most opposing units adjacent will die. If both units involved in a battle have the same number of opposing units adjacent, both will die. If two units (regardless of color) move to the same position, both will die. Here are some examples, where 'a' represents a red unit, 'b' represents a blue unit, '.' represents an empty space, and 'x' represents a dead unit:

    .....     .....
    .ab..  >  .xx..
    .....     .....
    

    .....     .....
    .aba.  >  .axa.
    .....     .....


    ...ab     ...xx
    .aba.  >  .axx.
    ...b.     ...b.


    ...ab.     ...xb.
    .bab..  >  .bxx..
    .bab..     .bxx..
    ...ab.     ...xb.
    
If a unit moves onto an opposing player's spawn, that spawn is disabled for the remainder of the game.

The order actions are carried out in each turn is as follows:
1. Units are moved according to commands provided by player bots
2.  If opposing units are adjacent, battle(s) take place to determine which units die
3. If a unit is on an opposing player's spawn at this point, the spawn is razed (disabled)
4. If a player has sufficient energy, and his/her spawn is not disabled, a unit is added at his/her spawn point, and the player's energy is decremented by one
5. If any units are adjacent to energy, that energy is consumed and the respective player's energy is incremented by one. If opposing units are adjacent to the same energy, the energy is removed and neither player gets it
6. If a sufficient number of turns have passed since the last energy was spawned (3), two more are randomly but symmetrically spawned on the field

Communication between the game and the bots is established using standard input and output. For every turn, the two bots are given the current game state as JSON. Each bot is expected to respond with moves within two seconds. If a bot doesn't respond within two seconds, it is disqualified.

This is an example of the game state that will be passed to each bot:

    "state": {
      "rows": 4,
      "cols": 4,
      "p1": {
        "food": 0,
        "spawn": 5
      },
      "p2": {
        "food": 0,
        "spawn": 10
      },
      "grid": ".....a....b.....",
        "maxTurns": 20,
        "turnsElapsed": 0
      },
      "player": "a"

Where "player" represents which side the bot is playing as, and is either "a" or "b". The grid is a string where each character represents a space on the grid. The grid's dimensions are provided as "rows" and "cols". p1.spawn and p2.spawn represent the indices of their respective players' spawn points on the grid string. p1.food and p2.food represent the amount of energy each player currently has. On the grid, p1 units are identified by "a", p2 units are identified by "b", energy is identified by "*", empty space is identified by ".", and units killed in the previous turn are identified by "x".

Bots are expected to respond in the following format:

    [
      {
        "from": 12,
        "to": 11
      },
      {
        "from": 21,
        "to": 20
      }
    ]

Where each item in the array represents a move. "from" must be the index of one of the bot's units, and "to" must be the index of a coordinate adjacent to that unit. Otherwise, the move is ignored.

Bots should be written in Node or Ruby.

[Example Ruby bot](/bots/rubybot.rb)

[Example Node bot](/bots/nodebot.js)
