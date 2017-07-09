'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Game', {
    p1: DataTypes.STRING,
    p2: DataTypes.STRING,
    end: { type: DataTypes.STRING, defaultValue: 'elegant' },
    winner: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now },
    finishedAt: DataTypes.DATE,
    finished: { type: DataTypes.BOOLEAN, defaultValue: false },
    round: DataTypes.INTEGER,
  });
};
