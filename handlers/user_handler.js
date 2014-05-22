var User = require('../models').User;

module.exports = {
  listUsers: function(req, res) {
    User.all({
        attributes: ['id', 'firstName', 'lastName', 'email']
      }).success(function(users) {
        res.render('userlist', {users:users});
      });
  },

  createUser: function(req, res) {
    User.create(req.body)
      .success(function(user) {
        res.redirect('/users/' + user.id);
      });
  },

  getUser: function(req, res) {
    User.find({
        where: {id:req.params.userId},
        attributes: ['id', 'firstName', 'lastName', 'email']
      }).success(function(user) {
        res.render('profile', {user:user});
      });
  },

  editUser: function(req, res) {
    User.find(req.params.userId)
      .success(function(user) {
        user.updateAttributes(req.body)
          .success(function(user) {
            res.render('profile', {user:user});
          });
      });
  },

  deleteUser: function(req, res) {
    User.find(req.params.userId)
      .success(function(user) {
        user.destroy()
          .success(function() {
            res.redirect('/users');
          });
      });
  }
};
