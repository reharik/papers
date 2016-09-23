const http = require('_http_server');

const authenticationMiddleware = (strategies, papersOptions, clientOptions) => {
  return (req, res, next) => {
    let failures = [];

    const redirect = (url, status) => {
      res.statusCode = status || 302;
      res.setHeader('Location', url);
      res.setHeader('Content-Length', '0');
      res.end();
    };

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      if (!strategy) {
        continue;
      }

      const result = strategy.authenticate(req, clientOptions);
      switch (result.type) {
        case 'fail':
        {
          // details here is {error, status}
          failures.push(result.details);
          break;
        }
        case 'redirect':
        {
          redirect(result.details.url, result.details.status);
          break;
        }
        case 'error':
        {
          if(customHandler) {
            customHandler(result);
            return next();
          }
          next(result.details.error);
          break;
        }
        case 'success':
        {
          if(customHandler) {
            customHandler(result);
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

          req.login(req, papersOptions, clientOptions);

          // /********* authInfo *************/
          // if (clientOptions.authInfo !== false) {
          //   req.authInfo = papers.transformAuthInfo(info);
          // }

          /********* redirect *************/
          var redirectUrl = req.session.returnTo || clientOptions.successRedirect;
          delete req.session.returnTo;
          if(redirectUrl){
            res.redirect(redirectUrl);
          }
          return next()
        }
        case 'sessionSuccess':{
         // this is for the non login case where the user is pulled from session.
         // we want don't want to pass through, and we don't want to re login, just proceed.
          return next();
        }
      }
    }

    if(failures.length <= 0){
      failures.push({error: "No successful login strategy found", status: 401})
    }

    var errorMessages = failures.filter(failure => typeof failure.challenge == 'string').map(failure => failure.challenge);
    res.statusCode = failures.map(function(f) { return f.status; }).reduce((prev, curr) => prev || curr, 401 );

    if(customHandler) {
      customHandler({type:'fail', details: {errorMessage: errorMessages[0], statusCode: http.STATUS_CODES[res.statusCode]}});
      return next();
    }

    if (res.statusCode == 401 && errorMessages.length) {
      res.setHeader('WWW-Authenticate', errorMessages);
    }
    if (clientOptions.failWithError) {
      return next(new Error(http.STATUS_CODES[res.statusCode]));
    }
    res.end(http.STATUS_CODES[res.statusCode]);

  }
};