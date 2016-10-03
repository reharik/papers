'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const http = require('_http_server');
const co = require('co');
const handleFailurePostIteration = require('./handleFailurePostIteration');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const standardizeErrors = require('./standardizeErrors');

const redirect = require('./redirect');
const checkSessionForAuth = require('./checkSessionForAuth');

const createAuthenticationMiddleware = papers => {

  const authenticationMiddleware = (req, res, next) => {
    /********* add convenience methods to req *************/
    req.logOut = papers.functions.logOut(req, papers.options.userProperty, papers.options.key);
    req.isAuthenticated = papers.functions.isAuthenticated(req);

    /********* check session for auth *************/

    co(function* iterateStrategies() {

      const checkSession = yield checkSessionForAuth(papers, req);
      if (checkSession.isLoggedIn) {
        return { type: 'session' };
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
          continue;
        }

        switch (stratResult.type) {
          case 'fail':
            {
              failures.push(standardizeErrors(stratResult));
              break;
            }
          case 'redirect':
            {
              return { type: 'redirect', value: redirect(res, stratResult.details.url, stratResult.details.statusCode) };
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
    }).then(result => {
      switch (result.type) {
        case 'customHandler':
          {
            return papers.functions.customHandler(req, res, next, result.value);
          }
        case 'error':
          {
            return next(result.value.exception);
          }
        case 'failWithError':
          {
            return next(result.value);
          }
        case 'success':
          {
            return next();
          }
        default:
          {
            return res.end(http.STATUS_CODES[res.statusCode]);
          }
      }
    }).catch(ex => {
      console.log('==========ex=========');
      console.log(ex);
      console.log('==========END ex=========');
      res.statusCode = 500;
      return res.end(`${ http.STATUS_CODES[500] } \n ${ ex.message } \n ${ ex }`);
    });
  };

  // I feel like this should be in a separate module but I need the closure for papers
  if (papers.koa === true) {
    return function* (next) {
      authenticationMiddleware(this.request, this.response, next);
    };
  } else if (papers.koa2 === true) {
    return (() => {
      var _ref = _asyncToGenerator(function* (ctx, next) {
        authenticationMiddleware(ctx.request, ctx.response, next);
      });

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    })();
  } else {
    return authenticationMiddleware;
  }
};

module.exports = createAuthenticationMiddleware;