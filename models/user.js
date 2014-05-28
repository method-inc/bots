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
      unique: true,
      validate: {
        notNull: true
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notNull: true
      },
      set: function(v, cb) {
        var hash = bcrypt.hashSync(v, salt.value);
        this.setDataValue('password', hash);
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Bot);
      },
      authorize: function(email, password, fn) {
        User.find({ where: {email: email} })
          .success(function(user) {
            if(user && user.password === bcrypt.hashSync(password, salt.value)) {
              return fn(undefined, user);
            }
            fn(new Error('invalid username or password'), undefined);
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
