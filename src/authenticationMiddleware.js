const http = require('_http_server');

module.exports = createAuthenticationMiddleware = (papers) => {
  return (req, res, next) => {

    /********* add convenience methods to req *************/
    req.logOut = papers.functions.logOut(req, {userProperty: papers.options.userProperty, key: papers.options.key});
    req.isAuthenticated = papers.functions.isAuthenticated(req);

    /********* check session for auth *************/
    if(papers.options.useSession
      && req.session[papers.options.key]
      && req.session[papers.options.key].user) {
      try {
        const user = papers.functions.deserializeUser(req.session[papers.options.key].user, papers);

        if (user) {
          req[papers.options.userProperty] = user;
          return next();
        }
        delete req.session[papers.options.key].user;
      } catch (ex) {
        throw new Error("Error thrown during deserialization of user.");
      }
    }

    const redirect = (url, status) => {
      res.statusCode = status || 302;
      res.setHeader('Location', url);
      res.setHeader('Content-Length', '0');
      return res.end();

    };

    /********* iterate strategies *************/
    let failures = [];
    for (let i = 0; i <  papers.functions.strategies.length; i++) {
      //TODO make a instantiation function that accomidates different strategies

      const strategy = papers.functions.strategies[i]();
      if (!strategy) {
        continue;
      }

      const result = strategy.authenticate(req, papers);
      if(!result || !result.type){
        continue
      }

      switch (result.type) {
        case 'fail':
        {
          // details here is {error, status}

          //TODO validate that details is in correct format
          //TODO stragegy for deailing with different error types
          failures.push(result.details);
          break;
        }
        case 'redirect':
        {
          return redirect(result.details.url, result.details.status);
        }
        case 'error':
        {
          if(papers.options.customHandler) {
            papers.options.customHandler(result);
            return next(result.error);
          }
          next(result.details.error);
          break;
        }
        case 'success':
        {
          if(papers.options.customHandler) {
            papers.options.customHandler(result);
            return next();
          }

          // /********* successFlash *************/
          // if (clientOptions.successFlash) {
          //   var flash = {
          //     type: clientOptions.successFlash.type || info.type || 'success',
          //     message: clientOptions.successFlash.message || info.message || info || 'success'
          //   };
          //   req.flash(flash.type, flash.msg);
          // }
          //
          // /********* successMessage *************/
          // if (clientOptions.successMessage) {
          //   req.session.messages = req.session.messages || [];
          //   req.session.messages.push(typeof msg == 'boolean' ? info.message || info || 'success' : msg);
          // }
          //
          // /********* assignProperty *************/
          // if (clientOptions.assignProperty) {
          //   req[clientOptions.assignProperty] = user;
          //   return next();
          // }

          papers.functions.logIn(req, papers);

          // /********* authInfo *************/
          // if (clientOptions.authInfo !== false) {
          //   req.authInfo = papers.transformAuthInfo(info);
          // }

          /********* redirect *************/
          var redirectUrl = req.session.returnTo || papers.options.successRedirect;
          delete req.session.returnTo;
          if(redirectUrl){
            redirect(redirectUrl, 200);
          }
          return next()
        }
      }
    }

    if(failures.length <= 0){
      failures.push({error: "No successful login strategy found", status: 401})
    }

    var errorMessages = failures.filter(failure => failure
        && failure.error
        && typeof failure.error == 'string')
      .map(failure => failure.error);
    res.statusCode = failures.map(function(f) { return f.status; }).reduce((prev, curr) => prev || curr, 401 );

    if(papers.options.customHandler) {
      papers.options.customHandler({type:'fail', details: {errorMessage: errorMessages[0], statusCode: http.STATUS_CODES[res.statusCode]}});
      return next();
    }
    if (res.statusCode == 401 && errorMessages.length) {
      res.setHeader('WWW-Authenticate', errorMessages);
    }
    if (papers.options.failWithError) {
      return next(new Error(http.STATUS_CODES[res.statusCode]));
    }

    const redirectOnFailureUrl = papers.options.failureRedirect;
    if(redirectOnFailureUrl){
      redirect(redirectOnFailureUrl, res.statusCode);
    }

    res.end(http.STATUS_CODES[res.statusCode]);
  }
};