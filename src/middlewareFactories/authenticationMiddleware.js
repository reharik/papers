const http = require('_http_server');

const authenticationMiddleware = (strategies, clientOptions, papersOptions) => {
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
          //TODO sanitize and standarize error message
          // details here is {error, status}
          failures.push(result.details);

          //TODO put clientOptions.failureRedirectTo here

          break;
        }
        case 'redirect':
        {
          redirect(result.details.url, result.details.status);
          break;
        }
        case 'error':
        {
          next(result.details.error);
          break;
        }
        case 'success':
        {

          //TODO need custom callback imple
          //TODO need a session restored login pass through. perhaps as it's own response type


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
      }
    }

    if(failures.length <= 0){
      failures.push({error: "No successful login strategy found", status: 401})
    }

    var errorMessages = failures.filter(failure => typeof failure.challenge == 'string').map(failure => failure.challenge)
    res.statusCode = failures.map(function(f) { return f.status; }).reduce((prev, curr) => prev || curr, 401 );

    if (res.statusCode == 401 && errorMessages.length) {
      res.setHeader('WWW-Authenticate', errorMessages);
    }
    if (clientOptions.failWithError) {
      return next(new Error(http.STATUS_CODES[res.statusCode]));
    }
    res.end(http.STATUS_CODES[res.statusCode]);

  }
};