var bcrypt = require('bcrypt');
var salt = require('../config/salt.json');

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    firstName: {
      type: DataTypes.STRING,
      validate: {
        notNull: true
      }
    },
    lastName: {
      type: DataTypes.STRING,
      validate: {
        notNull: true
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notNull: true
      }
    },
    password: {
      type: DataTypes.STRING,
      set: function(v) {
        this.passwordDigest = bcrypt.hashSync(v, salt.value);
      }
    },
    passwordDigest: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Bot);
      },
      authorize: function(email, password, fn) {
        User.find({ where: {email: email} })
          .success(function(user) {
            if(user.passwordDigest === bcrypt.hashSync(password, salt.value)) {
              return fn(undefined, user);
            }
            fn(new Error('invalid password'), undefined);
          })
          .error(function(err) {
            fn(err, undefined);
          });
      }
    },
    instanceMethods: {

    }
  });

  return User;
};
