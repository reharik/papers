const http = require('_http_server');
const co = require('co');
const handleFailurePostIteration = require('./handleFailurePostIteration');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const standardizeErrors = require('./standardizeErrors');

const redirect = require('./redirect');
const checkSessionForAuth = require('./checkSessionForAuth');


module.exports = createAuthenticationMiddleware = (papers) => {
  return (req, res, next) => {
    /********* add convenience methods to req *************/
    req.logOut = papers.functions.logOut(req, papers.options.userProperty, papers.options.key);
    req.isAuthenticated = papers.functions.isAuthenticated(req);

    /********* check session for auth *************/

    co(function *iterateStrategies() {

      const checkSession = yield checkSessionForAuth(papers, req);
      if(checkSession.isLoggedIn) {
        return {type:'session'};
      }

      let failures = [];

      /********* iterate strategies *************/
      for (let strategy of papers.functions.strategies) {

        if (!strategy) {
          continue;
        }

        var authenticate = strategy.authenticate(req, papers);
        const stratResult = authenticate && typeof authenticate.then === 'function' ? yield authenticate : authenticate;
        if (!stratResult || !stratResult.type) {
          continue
        }

        switch (stratResult.type) {
          case 'fail':
          {
            failures.push(standardizeErrors(stratResult));
            break;
          }
          case 'redirect':
          {
            return {type: 'redirect', value: redirect(res, stratResult.details.url, stratResult.details.statusCode)};
          }
          case 'error':
          {
            return handleError(stratResult, papers);
          }
          case 'success':
          {
            return handleSuccess(stratResult, req, res, papers);
          }
        }
      }
      return handleFailurePostIteration(failures, res, papers);
    }).then((result) => {
      switch(result.type) {
        case 'customHandler': {
          // sorry about this result.result business
          return papers.functions.customHandler(req, res, next, result.result);
        }
        case 'error': {
          return next(result.details.exception);
        }
        case 'fail': {
          return next(result.value);
        }
        case 'success': {
          return next();
        }
          // what is this returing on, what do I expect to fall through.
          // I know that session might be falling through and that should
          // not end but continue down the middle ware chain
        default:{
          return res.end(http.STATUS_CODES[res.statusCode]);
        }
      }
    }).catch(ex => {
      console.log('==========ex=========');
      console.log(ex);
      console.log('==========END ex=========');
      res.statusCode = 500;
      return res.end(`${http.STATUS_CODES[500]} \n ${ex.message} \n ${ex}`);
    })
  }
};