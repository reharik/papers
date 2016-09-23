
//mutations
module.exports = (req) => {

  req.login =
    req.logIn = function(user, papersOptions = {}, clientOptions = {}) {

      // if there is no session established set the user on the req and return
      // not sure why the client would pass a session into the authenticator like
      // this.  perhaps I should remove it.
      if (typeof clientOptions.session !== 'object' && clientOptions.session !== undefined) {
        req[papersOptions.userProperty] = result.details.user;
        return;
      }

      // if there is a session established but req._papers is undefined,
      // then you have probably forgotten initialize papers in setup
      if (!req._papers || !req._papers.instance) {
        throw new Error('papers.initialize() middleware not in use');
      }

      req.session = req.session || {};
      req._papers.session = req._papers.session || {};

      try {
        req._papers.session.user = req._papers.instance.serializeUser(result.details.user);
      } catch (err) {
        throw err
      }
      req.session[papersOptions.key] = req._papers.session;
      // I think this is supposed to be putting it somewhere else
      req[papersOptions.userProperty] = result.details.user;
    };
  
  req.logout =
    req.logOut = function() {
      var userProperty = (this._papers && this._papers.instance)
        ? this._papers.instance.userProperty
        : 'user';

      this[userProperty] = null;
      if (this._papers && this._papers.session) {
        delete this._papers.session.user;
      }
    };


  req.isAuthenticated = function() {
    var userProperty = (this._papers && this._papers.instance)
      ? this._papers.instance._userProperty
      : 'user';

    return (this[userProperty]) ? true : false;
  };

  /**
   * Test if request is unauthenticated.
   *
   * @return {Boolean}
   * @api public
   */
  req.isUnauthenticated = function() {
    return req.isAuthenticated();
  };
  
  return req;
};
