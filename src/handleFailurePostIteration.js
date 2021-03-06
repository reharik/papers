const http = require('_http_server');
const redirect = require('./redirect');
const standardizeErrors = require('./standardizeErrors');


module.exports = (failures, res, papers) => {
  if (failures.length <= 0) {
    failures.push({errorMessage: "No successful login strategy found", statusCode: 401})
  }

  var errorMessages = failures.filter(failure => failure
      && failure.errorMessage
      && typeof failure.errorMessage === 'string')
    .map(failure => failure.errorMessage);

  res.statusCode = failures.map(function (f) {
    return f.statusCode;
  }).reduce((prev, curr) => prev < curr ? curr : prev, 401);
  

  if (papers.functions.customHandler) {
    return {
      type: 'customHandler',
      result: { type: 'fail',
        details: {errorMessage: errorMessages[0], statusCode: http.STATUS_CODES[res.statusCode]}
      }
    };
  }

  if (res.statusCode == 401 && errorMessages.length) {
    res.setHeader('WWW-Authenticate', errorMessages);
  }
  
  if (papers.options.failWithError) {
    let result = {type: 'error', details: new Error(http.STATUS_CODES[res.statusCode])};
    result.details = standardizeErrors(result);
    return result
  }
  const redirectOnFailureUrl = papers.options.failureRedirect;
  if (redirectOnFailureUrl) {
    redirect(res, redirectOnFailureUrl);
    return {type: 'redirect'};
  }

  return {type: 'fallThrough'};
};