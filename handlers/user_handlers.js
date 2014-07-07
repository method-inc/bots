var User = require('../models').User;

module.exports = {
  listUsers: function(req, res) {
    User.all({
        attributes: ['id', 'firstName', 'lastName', 'email']
      }).success(function(users) {
        if(req.params.format === 'json') res.json(users);
        else res.render('userlist', {users:users});
      });
  },

  createUser: function(req, res) {
    User.create({
        firstName: req.body.firstName,
        lastName:  req.body.lastName,
        email:     req.body.email,
        password:  req.body.password
      })
      .complete(function(err, user) {
        if(err && err.errno===1062) res.json(409, {email: 'Duplicate email'});
        else if(err) res.json(400, err);
        else {
          req.session.userId = user.id;
          res.json(201, {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          });
        }
      });
  },

  getUser: function(req, res) {
    User
      .find({
        where: {id:req.params.userId},
        attributes: ['id', 'firstName', 'lastName', 'email']
      }).complete(function(err, user) {
        if(!user) res.send(404, 'user not found');
        else {
          if(req.params.format === 'json') res.json(user);
          else res.render('profile', {user:user, currentUserId:req.session.userId});
        }
      });
  },

  editUser: function(req, res) {
    User
      .find(req.params.userId)
      .complete(function(err, user) {
        if(user && req.session.userId===user.id) {
          user
            .updateAttributes({
              firstName: req.body.firstName,
              lastName:  req.body.lastName,
              email:     req.body.email
            })
            .complete(function(err, user) {
              res.json(200, {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              });
            });
        }
        else {
          res.send(401, 'unauthorized');
        }
      });
  },

  deleteUser: function(req, res) {
    User
      .find(req.params.userId)
      .complete(function(err, user) {
        if(user && req.session.userId===user.id) {
          user
            .destroy()
            .complete(function(err, user) {
              res.send(204);
            });
        }
        else {
          res.send(401, 'unauthorized');
        }
      });
  },

  login: function(req, res) {
    User.authorize(req.body.email, req.body.password, function(err, user) {
      if(user) {
        req.session.userId = user.id;
        res.json(201, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
      else {
        res.send(401, 'unauthorized');
      }
    });
  },

  logout: function(req, res) {
    req.session.userId = null;
    res.send(204);
  }
};
