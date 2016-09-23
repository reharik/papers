
//mutations
module.exports = (req) => {
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
