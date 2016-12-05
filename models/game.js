'use strict';

module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define('Game', {
    end: { type: DataTypes.STRING, defaultValue: 'elegant' },
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now },
    finishedAt: DataTypes.DATE,
    finished: { type: DataTypes.BOOLEAN, defaultValue: false },
    round: DataTypes.INTEGER,
  });

  return Game;
};
