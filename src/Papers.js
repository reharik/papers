var createAuthenticationMiddleware = require('./middlewareFactories/authenticationMiddleware');

module.exports = function() {

  logIn = function (req, user, papers) {

    req[papers.userProperty] = user;
    let session = req.session[papers.key] || {};

    if (typeof session !== 'object') {
      return;
    }
    try {
      session.user = papers.serializeUser(user);
    } catch (err) {
      throw err
    }
  };

  logOut = function (userProperty, key) {
    req[userProperty] = null;
    if (req.session && req.session[key]) {
      delete req.session[key].user;
    }
  };


  isAuthenticated = function (req) {
    if (!req._papers) {
      return false;
    }
    return (req.session[req._papers.key]) ? true : false;
  };

  serializeUser = function (user, papers) {
    // private implementation that traverses the chain of serializers, attempting
    // to serialize a user
    for (let i = 0; papers.serializers.length; i++) {

      var layer = papers.serializers[i];
      if (!layer) {
        throw new Error('Failed to serialize user into session');
      }

      try {
        const result = layer(user);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }

    }
  };

  deserializeUser = function (user, papers) {
    for (let i = 0; papers.deserializers; i++) {

      var layer = papers.deserializers[i];
      if (!layer) {
        throw new Error('Failed to serialize user into session');
      }

      try {
        const result = layer(user);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }
    }
  };

  transformAuthInfo = function (info, papers) {
    for (let i = 0; papers.infoTransformers; i++) {

      var layer = papers.infoTransformers[i];
      if (!layer) {

        // if no transformers are registered (or they all pass), the default
        // behavior is to use the un-transformed info as-is
        return info;
      }

      try {
        const result = layer(info);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }
    }
  };

  return {
    registerMiddleware: function (config) {
      if (!config.strategies || config.strategies.length <= 0) {
        throw new Error('You must provide at lease one strategy.');
      }
      if(config.useSession && (
          !config.serializers|| config.serializers.length <= 0
        || !config.deserializers || config.deserializers.length <= 0
        )){
        throw new Error('You must provide at least one user serializer and one user deserializer if you want to use session');
      }

      const papers = {
        functions: {
          strategies: config.strategies,
          serializers: config.serializers,
          deserializers: config.deserializers,
          infoTransformers: config.infoTransformers,
          logIn,
          logOut,
          isAuthenticated,
          serializeUser,
          deserializeUser,
          transformAuthInfo
        },
        options: {
          useSession: config.useSession,
          userProperty: 'user',
          key: 'papers',
        }
      };

      return createAuthenticationMiddleware(papers);
    }
  }
};