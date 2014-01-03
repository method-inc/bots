var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Game', new Schema({
  p1: { type: String },
  p2: { type: String },
  turns: { type: Array },
  end: { type: String, default:'elegant' },
  winner: { type: String },
  createdAt: { type: Date, default: Date.now }
}));
