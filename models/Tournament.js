var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Tournament', new Schema({
  games: { type: Array },
  nextGame: { }
}));

// model.games[n-1]: list of games for round n
// game layout: { id:objectId, p1:string, p2:string }
// nextGame: { time:Date, round:Number, game:Number }
