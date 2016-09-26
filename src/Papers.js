var createAuthenticationMiddleware = require('./authenticationMiddleware');

module.exports = function() {

  logIn = function (req, user, papers) {
    req[papers.options.userProperty] = user;
    let session = req.session && req.session[papers.options.key] ? req.session[papers.options.key] : null;

    if (!session) {
      return;
    }
    
    try {
      session.user = papers.functions.serializeUser(user, papers);
    } catch (err) {
      throw err
    }
  };

  logOut = function (req, userProperty, key) {
    return function () {
      req[userProperty] = null;
      if (req.session && req.session[key]) {
        delete req.session[key].user;
      }
    }
  };


  isAuthenticated = function (req) {
    return function () {
      if (!req._papers) {
        return false;
      }
      return (req.session[req._papers.key]) ? true : false;
    };
  };

  serializeUser = function (user, papers) {
    // private implementation that traverses the chain of serializers, attempting
    // to serialize a user
    for (let i = 0; papers.functions.serializers.length; i++) {

      var layer = papers.functions.serializers[i];
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
    for (let i = 0; papers.functions.deserializers; i++) {

      var layer = papers.functions.deserializers[i];
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
    for (let i = 0; papers.functions.infoTransformers; i++) {

      var layer = papers.functions.infoTransformers[i];
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
      if (!config || !config.strategies || config.strategies.length <= 0) {
        throw new Error('You must provide at lease one strategy.');
      }
      if(config.useSession && (
          !config.serializers|| config.serializers.length <= 0
        || !config.deserializers || config.deserializers.length <= 0
        )){
        throw new Error('You must provide at least one user serializer and one user deserializer if you want to use session.');
      }

      //TODO put some validation in for more of this. 
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
          failureRedirect: config.failureRedirect,
          successRedirect: config.successRedirect,
          failWithError: config.failWithError
        }
      };
      return createAuthenticationMiddleware(papers);
    }
  }
};