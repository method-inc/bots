var assert = require('assert');

module.exports = function(User) {
  describe('create', function() {
    var newUser;
    var newUserInfo;

    beforeEach(function() {
      newUserInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'somepassword'
      };
    });

    afterEach(function(done) {
      if(newUser) {
        newUser.destroy().complete(done);
      }
      else {
        done();
      }
    });

    it('should store first name, last name, and email', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user.firstName, 'John');
        assert.equal(user.lastName, 'Doe');
        assert.equal(user.email, 'johndoe@example.com');
        done();
      });
    });

    it('should not store password', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user.password, null);
        done();
      });
    });

    it('should store a password digest', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.notEqual(user.passwordDigest, null);
        done();
      });
    });

    it('should encrypt password digest', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.notEqual(user.passwordDigest, 'somepassword');
        done();
      });
    });

    it('should require first name', function(done) {
      newUserInfo.firstName = null;
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user, null);
        assert.ok(err.firstName);
        done();
      });
    });

    it('should require last name', function(done) {
      newUserInfo.lastName = null;
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user, null);
        assert.ok(err.lastName);
        done();
      });
    });

    it('should require email', function(done) {
      newUserInfo.email = null;
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user, null);
        assert.ok(err.email);
        done();
      });
    });
  });
};
