var models = require('../models');

models.User
  .find({ where: {email: "mbriesen@skookum.com"} })
  .success(function(user) {
    if (user) {
      console.log('found user');
      console.log(JSON.stringify(user, null, 4));
      return;
    }
    console.log('no user found');
    models.User
      .create({
        firstName: 'Moby',
        lastName: 'von Briesen',
        email: 'mbriesen@skookum.com',
        password: 'password'
      })
      .complete(function(err, user) {
        if (err) throw err;
      });
  });
