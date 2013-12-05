aliens
======
After cloning the repo run `npm install`

In order to set up the server, run `node app.js` in your terminal.

Go to `http://localhost:3000` in your browser.

To start a game, two bots must connect to the server. There are two example bots: one in Node and one in Ruby.

To start the Node bot, run `node example_bots/nodebot.js` in a new terminal window.

To start the Ruby bot, run `ruby example_bots/rubybot.rb` in a new terminal window.

After the both bots connect, the game will begin. The bots will disconnect after the game finishes. It is possible to view the game in the browser as it happens. The left and right arrow keys can be used to go between turns.
