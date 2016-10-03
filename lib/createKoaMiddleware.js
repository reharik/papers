'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const http = require('_http_server');
const handleFailurePostIteration = require('./handleFailurePostIteration');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const standardizeErrors = require('./standardizeErrors');

const redirect = require('./redirect');
const checkSessionForAuth = require('./checkSessionForAuth');

const createKoaMiddleware = papers => {

  return (() => {
    var _ref = _asyncToGenerator(function* (ctx, next) {
      /********* add convenience methods to req *************/
      ctx.req.logOut = papers.functions.logOut(ctx.req, papers.options.userProperty, papers.options.key);
      ctx.req.isAuthenticated = papers.functions.isAuthenticated(ctx.req);

      /********* check session for auth *************/

      const checkSession = yield checkSessionForAuth(papers, ctx);
      if (checkSession.isLoggedIn) {
        return { type: 'session' };
      }

      const iterate = (() => {
        var _ref2 = _asyncToGenerator(function* () {
          let failures = [];

          /********* iterate strategies *************/
          for (let strategy of papers.functions.strategies) {

            if (!strategy) {
              continue;
            }

            var stratResult = yield strategy.authenticate(ctx.req, papers);
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
                  return {
                    type: 'redirect',
                    value: redirect(ctx.res, stratResult.details.url, stratResult.details.statusCode)
                  };
                }
              case 'error':
                {
                  return handleError(stratResult, papers);
                }
              case 'success':
                {
                  return handleSuccess(stratResult, ctx.req, ctx.res, papers);
                }
            }
          }
          return handleFailurePostIteration(failures, ctx.res, papers);
        });

        return function iterate() {
          return _ref2.apply(this, arguments);
        };
      })();

      const handleResult = function (result) {
        switch (result.type) {
          case 'customHandler':
            {
              return papers.functions.customHandler(ctx.req, ctx.res, next, result.value);
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
              return ctx.res.end(http.STATUS_CODES[ctx.res.statusCode]);
            }
        }
      };

      try {
        return handleResult(iterate());
      } catch (ex) {
        console.log('==========ex=========');
        console.log(ex);
        console.log('==========END ex=========');
        ctx.res.statusCode = 500;
        return ctx.res.end(`${ http.STATUS_CODES[500] } \n ${ ex.message } \n ${ ex }`);
      }
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();
};

module.exports = createKoaMiddleware;