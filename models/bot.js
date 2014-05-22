module.exports = function(sequelize, DataTypes) {
  var Bot = sequelize.define('Bot', {
    url: {
      type: DataTypes.STRING,
      validate: {
        notNull: true
      }
    },
  }, {
    classMethods: {
      associate: function(models) {
        Bot.belongsTo(models.User);
      }
    }
  });

  return Bot;
};
