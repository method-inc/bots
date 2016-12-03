var profileScope = 'https://www.googleapis.com/auth/userinfo.profile';
var emailScope = 'https://www.googleapis.com/auth/userinfo.email';

module.exports = function(everyauth, User) {
  everyauth.google
    .appId(process.env.GOOGLE_APP_ID || '3335216477.apps.googleusercontent.com')
    .appSecret(process.env.GOOGLE_APP_SECRET || 'PJMW_uP39nogdu0WpBuqMhtB')
    .scope(profileScope + ' ' + emailScope) // What you want access to
    .handleAuthCallbackError( function(req, res) {
      console.log(req);
    })
    .findOrCreateUser( function(session, accessToken, accessTokenExtra, googleUserMetadata) {
      var promise = this.Promise();

      User.findOrCreate({ where: { googleId: googleUserMetadata.id }, defaults: {
        name: googleUserMetadata.name,
        email: googleUserMetadata.email,
        picture: googleUserMetadata.picture,
      } }).spread(function(user, created) {
        promise.fulfill(user);
      });

      return promise;
    })
    .entryPath('/auth/google')
    .callbackPath('/auth/google/callback')
    .redirectPath('/');

  everyauth.everymodule.findUserById(function(userId, callback) {
    User.findById(userId)
      .then(function(user, err) {
        return callback(err, user);
      });
  });
};
