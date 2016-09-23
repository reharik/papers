/**
 * Module dependencies.
 */
var pause = require('pause')
  , util = require('util');


/**
 * `SessionStrategy` constructor.
 *
 * @api public
 */
module.exports = class SessionStrategy {
  constructor() {
    this.name = 'session';
  }

  /**
   * Authenticate request based on the current session state.
   *
   * The session authentication strategy uses the session to restore any login
   * state across requests.  If a login session has been established, `req.user`
   * will be populated with the current user.
   *
   * This strategy is registered automatically by papers.
   *
   * @param {Object} req
   * @param {Object} options
   * @api protected
   */
  authenticate = function (req, options) {
    if (!req._papers) {
      return this.error(new Error('papers.initialize() middleware not in use'));
    }

    const user = req._papers.session ? req._papers.session.user : null;

    if (!(user || user === 0)) {
      return {type: 'pass'};
    }
    // NOTE: Stream pausing is desirable in the case where later middleware is
    //       listening for events emitted from request.  For discussion on the
    //       matter, refer to: https://github.com/jaredhanson/papers/pull/106

    var paused = options.pauseStream ? pause(req) : null;
    const deserializedUser = req._papers.instance.deserializeUser(user, req);

    // return self.error(err);
    if (!deserializedUser) {
      delete req._papers.session.user;
      if (paused) {
        paused.resume();
      }
      return {type: 'pass'};
    }

    var property = req._papers.instance._userProperty || 'user';
    req[property] = deserializedUser;
    if (paused) {
      paused.resume();
    }
    return {type: 'sessionSuccess'};
  };
}
