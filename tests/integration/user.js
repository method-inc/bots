var assert = require('assert');

module.exports = function() {
  var http = require('http');
  var request = require('request');
  var options = {
    url: 'http://localhost:3000/users',
    method: 'POST',
    jar: true,
    form: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'somepassword'
    }
  };

  var newUserId;

  describe('create', function() {
    it('should create a new user and respond with a 201', function(done) {
      request(options, function(err, res, body) {
        body = JSON.parse(body);
        newUserId = body.id;
        assert.equal(res.statusCode, 201);
        assert.equal(body.firstName, 'John');
        assert.equal(body.lastName, 'Doe');
        assert.equal(body.email, 'johndoe@example.com');
        done();
      });
    });

    it('should respond with a 409 on attempted creation of duplicate user', function(done) {
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 409);
        done();
      });
    });

    it('should respond with a 400 on attempted creation of incomplete user', function(done) {
      options.form.password = null;
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 400);
        done();
      });
    });
  });

  describe('read', function() {
    before(function() {
      options = {
        method: 'GET',
        jar: true,
        url: 'http://localhost:3000/users/' + newUserId + '.json'
      };
    });
    it('should return an existing user and respond with a 200', function(done) {
      request(options, function(err, res, body) {
        body = JSON.parse(body);
        assert.equal(res.statusCode, 200);
        assert.equal(body.firstName, 'John');
        assert.equal(body.lastName, 'Doe');
        assert.equal(body.email, 'johndoe@example.com');
        done();
      });
    });
    it('should respond with a 404 on attempted retrieval of a nonexistent user', function(done) {
      options.url = 'http://localhost:3000/users/null.json';
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 404);
        done();
      });
    });
    it('should return all users and respond with a 200', function(done) {
      options.url = 'http://localhost:3000/users.json';
      request(options, function(err, res, body) {
        body = JSON.parse(body);
        assert.equal(res.statusCode, 200);
        assert.ok(body instanceof Array);
        done();
      });
    });
  });

  describe('update', function() {
    before(function() {
      options = {
        method: 'PUT',
        jar: true,
        url: 'http://localhost:3000/users/' + newUserId,
        form: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@example.com'
        }
      };
    });
    it('should update an existing user and respond with a 200', function(done) {
      options.form.firstName = 'Joe';
      request(options, function(err, res, body) {
        body = JSON.parse(body);
        assert.equal(res.statusCode, 200);
        assert.equal(body.firstName, 'Joe');
        assert.equal(body.lastName, 'Doe');
        assert.equal(body.email, 'johndoe@example.com');
        done();
      });
    });
    it('should respond with a 401 if unauthorized to update user', function(done) {
      options.url = 'http://localhost:3000/users/null';
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        done();
      });
    });
  });

  describe('delete', function() {
    before(function() {
      options = {
        method: 'DELETE',
        jar: true,
        url: 'http://localhost:3000/users/' + newUserId
      }
    });
    it('should delete an existing user and respond with a 204', function(done) {
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 204);
        done();
      });
    });
    it('should respond with a 401 if unauthorized to delete user', function(done) {
      options.url = 'http://localhost:3000/users/null';
      request(options, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        done();
      });
    });
  });
};
