var models = require('../../models');

before(function(done) {
  models
    .sequelize
    .sync()
    .complete(function(err) {
      done();
    });
});

describe('User', function(){
  require('./user/create')(models.User);
  require('./user/authenticate')(models.User);
});
