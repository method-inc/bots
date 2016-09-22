"use strict";

module.exports = function(sequelize, DataTypes) {
  var Turn = sequelize.define("Turn", {
    rows: DataTypes.INTEGER,
    cols: DataTypes.INTEGER,
    maxTurns: { type: DataTypes.INTEGER, defaultValue: 20 },
    turnsElapsed: DataTypes.INTEGER,
    grid: DataTypes.STRING,
    p1Energy: DataTypes.INTEGER,
    p1Spawn: DataTypes.INTEGER,
    p2Energy: DataTypes.INTEGER,
    p2Spawn: DataTypes.INTEGER,
  }, {
    getterMethods: {
      p1: function() {
        return {
          energy: this.p1Energy,
          spawn: this.p1Spawn,
        };
      },
      p2: function () {
        return {
          energy: this.p2Energy,
          spawn: this.p2Spawn,
        }
      }
    },
    setterMethods: {
      p1: function(value) {
        this.setDataValue('p1Energy', value.energy);
        this.setDataValue('p1Spawn', value.spawn);
      },
      p2: function(value) {
        this.setDataValue('p2Energy', value.energy);
        this.setDataValue('p2Spawn', value.spawn);
      }
    }
  });

  return Turn;
};