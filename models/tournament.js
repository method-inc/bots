'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Tournament', {
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now },
    nextGameNumber: DataTypes.INTEGER,
    nextGameTime: DataTypes.DATE,
    nextGameRound: DataTypes.INTEGER,
  }, {
    getterMethods: {
      nextGame: function() {
        return {
          time: this.nextGameTime,
          game: this.nextGameGame,
          number: this.nextGameNumber,
        };
      },
    },
    setterMethods: {
      nextGame: function(value) {
        this.setDataValue('nextGameNumber', value.number);
        this.setDataValue('nextGameGame', value.game);
        this.setDataValue('nextGameTime', value.time);
      },
    },
  });
};
