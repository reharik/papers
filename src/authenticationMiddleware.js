const http = require('_http_server');
const co = require('co');
const handleFailurePostIteration = require('./handleFailurePostIteration');
const handleSuccess = require('./handleSuccess');
const instantiateStrategy = require('./instantiateStrategy');
const standardizeErrors = require('./standardizeErrors');
const redirect = require('./redirect');
const checkSessionForAuth = require('./checkSessionForAuth');


module.exports = createAuthenticationMiddleware = (papers) => {

  return (req, res, next) => {
    /********* add convenience methods to req *************/
    req.logOut = papers.functions.logOut(req, {userProperty: papers.options.userProperty, key: papers.options.key});
    req.isAuthenticated = papers.functions.isAuthenticated(req);

    /********* check session for auth *************/
    if(checkSessionForAuth(papers, req)) {
      return next();
    }

    co(function *iterateStrategies() {

      /********* iterate strategies *************/
      let failures = [];
      for (let _strategy of papers.functions.strategies) {

        const strategy = instantiateStrategy(_strategy);
        if (!strategy) {
          continue;
        }

        var authenticate = strategy.authenticate(req, papers);

        // console.log('==========typeof authenticate.then === "function"=========');
        // console.log(typeof authenticate.then === 'function');
        // console.log('==========END typeof authenticate.then === "function"=========');

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
            const standardizedError = standardizeErrors(stratResult);
            if (papers.functions.customHandler) {
              return {type: 'customHandler', result: 'error', value: standardizedError};
            }
            // return next(standardizedError);
            return {type: 'error', value: standardizedError};
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
          return papers.functions.customHandler(result.value);
        }
        case 'error':
        case 'fail': {
          return next(result.value);
        }
        case 'success': {
          return next();
        }
        default:{
          return res.end(http.STATUS_CODES[res.statusCode]);
        }
      }
    }).catch(ex => {
      console.log('==========ex=========');
      console.log(ex);
      console.log('==========END ex=========');
      throw ex;
    })
  }
};