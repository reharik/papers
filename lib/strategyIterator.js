'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const co = require('co');
const checkSessionForAuth = require('./checkSessionForAuth');
const handleFailurePostIteration = require('./handleFailurePostIteration');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const standardizeErrors = require('./standardizeErrors');
const redirect = require('./redirect');

const coIterator = function (req, res, papers) {
  return co(function* iterateStrategies() {

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
  });
};

const asyncIterator = (() => {
  var _ref = _asyncToGenerator(function* (req, res, papers) {

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

      var stratResult = yield strategy.authenticate(req, papers);
      // const stratResult = authenticate && typeof authenticate.then === 'function' ? yield authenticate : authenticate;
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
  });

  return function asyncIterator(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  coIterator,
  asyncIterator
};