'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    picture: DataTypes.STRING,
    participating: DataTypes.BOOLEAN,
    googleId: DataTypes.STRING,
    bot: DataTypes.STRING,
  });
};
