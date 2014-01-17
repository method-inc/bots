# History
The year is 3015. Earth is no longer the paradise it once was. The rain forests are just a myth. The ocreans are foul and slick with oil. Potable water has become the main form of currency - and war. Humans no longer live in cities, but in small urban tribal communities. They battle one another, but their biggest fear is the Bots. Humans no longer ponder the meaning of life or when it all began. They know the Singularity is the beginning - and the end.

Something has changed though. The Bots evolved into something wholly unexpected - they developed emotions. In juxaposition to the humans who turned from primal emotions into sentient beings, the Bots have tured from sentient beings into entities driven by emotion.

These emotion driven Bots no longer work towards the same goals and war has broken out among the Bots with devestating consquences to the human race who are nothing but collateral to the Bots. This war will continue until only one Bot remains.

# Testing your bot
After cloning the repo run `npm install`

In order to set up the server, run `node app.js` in your terminal.

Go to `http://localhost:3000` in your browser.

# Game Rules

SDW Bot Wars is a Turn Based Strategy (TBS) game where two competitors build sentient bots to battle til the death.

The field consists of a 20 by 20 grid. There are two spawn points at opposite corners for the red bot and blue bot. One botlet for each bot is spawned in the first turn. 

Energy is spawned randomly around the field every three turns. If a botlet gathers energy (by moving adjacent to it), another botlet will be spawned for that bot on the next turn. Each botlet of a bot's color can be moved one space per turn (up, down, left, or right, so no diagonals). If a bot submits turns in an invalid format, it will be disqualified. Invalid moves will be ignored and the bot will miss their turn.

## Battles
The goal is to eliminate all botlets of the opponent bot's color. If botlets of differing colors are adjacent after moving, a battle will commence. 

+ In the event of a battle, the botlet with the most opposing botlets adjacent will die. 
+ If both botlets involved in a battle have the same number of opposing botlets adjacent, both will die.
+ If two botlets (regardless of color) move to the same position, both will die. 

Here are some examples, where 'a' represents a red botlet, 'b' represents a blue botlet, '.' represents an empty space, and 'x' represents a dead botlet:

Same number of botlets

    .....     .....
    .ab..  >  .xx..
    .....     .....

Two vs. 1

    .....     .....
    .aba.  >  .axa.
    .....     .....

Multiple battles

    ...ab     ...xx
    .aba.  >  .axx.
    ...b.     ...b.


More battles

    ...ab.     ...xb.
    .bab..  >  .bxx..
    .bab..     .bxx..
    ...ab.     ...xb.
    
## Spawn Razing
If a botlet moves onto an opposing bot's spawn, that spawn is razed and no more botlets can be produced for the opposing bot.

## Turns
The order actions are carried out in each turn is as follows:

1. Botlets are moved according to commands provided by the bot
2. If opposing botlets are adjacent, battle(s) take place to determine which botlets die
3. If a botlet is on an opposing bot's spawn at this point, the spawn is razed (disabled)
4. If a bot has sufficient energy, and his/her spawn is not disabled, a botlet is added at his/her spawn point, and the bot's energy is decremented by one
5. If any botlets are adjacent to energy, that energy is consumed and the respective bot's energy is incremented by one. If opposing botlets are adjacent to the same energy, the energy is removed and neither bot gets it
6. If a sufficient number of turns have passed since the last energy was spawned (3), two more are randomly but symmetrically spawned on the field

The game ends when either one bot's botlets are completely eliminated or when the turn limit (100 turns) has been reached. If the turn limit is reached, the bot with more botlets on the field is declared the winner.

# Implementation Details
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

Where "player" represents which side the bot is playing as, and is either "a" or "b". p1.spawn and p2.spawn represent the indices of their respective bots' spawn points on the grid string. p1.food and p2.food represent the amount of energy each bot currently has. 

## The Grid

The grid is a string where each character represents a space on the grid. 

+ The grid's dimensions are provided as "rows" and "cols". 
+ On the grid, p1 botlets are identified by "a", p2 botlets are identified by "b"
+ Energy is identified by "\*"
+ Empty space is identified by "."
+ Botlets killed in the previous turn are identified by "x".

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

Where each item in the array represents a move. "from" must be the index of one of the bot's botlets, and "to" must be the index of a coordinate adjacent to that botlet. Otherwise, the move is ignored.

Bots should be written in JavaScript or Ruby.

[Example Ruby bot](/bots/rubybot.rb)

[Example JavaScript bot](/bots/nodebot.js)
