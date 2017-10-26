module.exports = function isAuthenticated(req, res, next) {
  if (!req.loggedIn) {
    res.redirect('/loggedout');
    return;
  }

  next();
}