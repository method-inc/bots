var assert = require('assert');
var models = require('../models');
var User = models.User;
var newUser;

describe('User', function(){
  before(function(done) {
    models
      .sequelize
      .sync({ force: true })
      .complete(function(err) {
        User
          .create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@example.com',
            password: 'somepassword'
          })
          .complete(function(err, user) {
            newUser = user;
            done();
          });
      });
  });
  describe('#create()', function() {
    it('should store first name', function() {
      assert.equal(newUser.firstName, 'John');
    });
    it('should store last name', function() {
      assert.equal(newUser.lastName, 'Doe');
    });
    it('should store email', function() {
      assert.equal(newUser.email, 'johndoe@example.com');
    });
    it('should NOT store password', function() {
      assert.equal(newUser.password, null);
    });
    it('should store a password digest', function() {
      assert.notEqual(newUser.passwordDigest, null);
    });
    it('should encrypt password digest', function() {
      assert.notEqual(newUser.passwordDigest, 'somepassword');
    });
  });
  describe('#authorize()', function() {
    it('should authenticate with correct email and password', function(done) {
      User.authorize('johndoe@example.com', 'somepassword', function(err, user) {
        assert.equal(user.email, newUser.email);
        done();
      });
    });
    it('should not authenticate with incorrect password', function(done) {
      User.authorize('johndoe@example.com', 'asdf', function(err, user) {
        assert.equal(user, null);
        done();
      });
    });
  });
});
