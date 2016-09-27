const http = require('_http_server');

module.exports = createAuthenticationMiddleware = (papers) => {
  //TODO do we even want to facilitate this?
  const instantiateStrategy = (strat) => {
    switch(typeof strat) {
      case 'function': {
        return strat();
      }
      case 'class': {
        return new Strat();
      }
      default: {
        return strat;
      }
    }
  };

  const standardizeErrors = (result) => {
    const status = result.details.status ? result.details.status : result.type === "fail"? 401 : 500;

    if (typeof result.details === 'string') {
      return {
        errorMessage: result.details,
        statusCode:status,
        exception: result.details
      }
    }

    if (typeof result.details.error === 'Error') {
      return {
        errorMessage: result.details.error.message,
        statusCode:status,
        exception: result.details.error
      }
    }

    if (typeof result.details.error === 'string') {
      return {
        errorMessage: result.details.error,
        statusCode:status,
        exception:result. details.error
      }
    }
  };



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

      const strategy = instantiateStrategy(papers.functions.strategies[i]);
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
          failures.push(standardizeErrors(result));
          break;
        }
        case 'redirect':
        {
          return redirect(result.details.url, result.details.statusCode);
        }
        case 'error':
        {
          const standardizedError = standardizeErrors(result);
          if(papers.functions.customHandler) {
            return papers.functions.customHandler({type:'error', details:standardizedError});
          }
          return next(standardizedError);
        }
        case 'success':
        {
          if(papers.functions.customHandler) {
            return papers.functions.customHandler(result);
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
          papers.functions.logIn(req, result.details.user, papers);

          // /********* authInfo *************/
          // if (clientOptions.authInfo !== false) {
          //   req.authInfo = papers.transformAuthInfo(info);
          // }

          /********* redirect *************/
          var redirectUrl = req.session && req.session.returnTo ? req.session.returnTo : papers.options.successRedirect;
          if(req.session) {
            delete req.session.returnTo;
          }
          if(redirectUrl){
            redirect(redirectUrl, 200);
          }
          return next()
        }
      }
    }

    if(failures.length <= 0){
      failures.push({errorMessage: "No successful login strategy found", statusCode: 401})
    }

    var errorMessages = failures.filter(failure => failure
        && failure.errorMessage
        && typeof failure.errorMessage === 'string')
      .map(failure => failure.errorMessage);
    res.statusCode = failures.map(function(f) { return f.statusCode; }).reduce((prev, curr) => prev < curr ? curr:prev, 401 );

    if(papers.functions.customHandler) {
      return papers.functions.customHandler({type:'fail', details: {errorMessage: errorMessages[0], statusCode: http.STATUS_CODES[res.statusCode]}});
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