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

    it('should store password', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.ok(user.password);
        done();
      });
    });

    it('should encrypt password', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.notEqual(user.password, 'somepassword');
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

    it('should require password', function(done) {
      newUserInfo.password = null;
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        assert.equal(user, null);
        assert.ok(err.password);
        done();
      });
    });

    it('should require a unique email', function(done) {
      User.create(newUserInfo).complete(function(err, user) {
        newUser = user;
        newUserInfo.firstName = 'Bill';
        newUserInfo.lastName = 'Johnson';
        newUserInfo.password = 'newpassword';
        User.create(newUserInfo).complete(function(err, user) {
          assert.equal(user, null);
          assert.ok(err);
          done();
        });
      });
    });
  });
};
