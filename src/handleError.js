const standardizeErrors = require('./standardizeErrors');

module.exports =  (stratResult, papers) => {
  const standardizedError = standardizeErrors(stratResult);
  if (papers.functions.customHandler) {
    return {type: 'customHandler', result: {type: 'error', details: standardizedError}};
  }
  return {type: 'error', details: standardizedError};
};