var assert = require('assert');

module.exports = function(User) {
  describe('authenticate', function() {
    var newUser;
    var newUserInfo;

    before(function(done) {
      newUserInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'somepassword'
      };
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        done();
      });
    });

    after(function(done) {
      newUser.destroy().complete(done);
    });

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

    it('should not authenticate with incorrect email', function(done) {
      User.authorize('johndoe123@example.com', 'somepassword', function(err, user) {
        assert.equal(user, null);
        done();
      });
    });
  });
};
