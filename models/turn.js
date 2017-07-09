'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Turn', {
    rows: DataTypes.INTEGER,
    cols: DataTypes.INTEGER,
    maxTurns: { type: DataTypes.INTEGER, defaultValue: 20 },
    turnsElapsed: DataTypes.INTEGER,
    grid: DataTypes.STRING,
    p1Energy: DataTypes.INTEGER,
    p1Spawn: DataTypes.INTEGER,
    p1SpawnDisabled: DataTypes.BOOLEAN,
    p2Energy: DataTypes.INTEGER,
    p2Spawn: DataTypes.INTEGER,
    p2SpawnDisabled: DataTypes.BOOLEAN,
  }, {
    getterMethods: {
      p1: function() {
        return {
          energy: this.p1Energy,
          spawn: this.p1Spawn,
          spawnDisabled: this.p1SpawnDisabled,
        };
      },
      p2: function() {
        return {
          energy: this.p2Energy,
          spawn: this.p2Spawn,
          spawnDisabled: this.p2SpawnDisabled,
        };
      },
    },
    setterMethods: {
      p1: function(value) {
        this.setDataValue('p1Energy', value.energy);
        this.setDataValue('p1Spawn', value.spawn);
        this.setDataValue('p1SpawnDisabled', value.spawnDisabled);
      },
      p2: function(value) {
        this.setDataValue('p2Energy', value.energy);
        this.setDataValue('p2Spawn', value.spawn);
        this.setDataValue('p2SpawnDisabled', value.spawnDisabled);
      },
    },
  });
};
