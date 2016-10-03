const strategyIterator = require('./strategyIterator');
const http = require('_http_server');

const createAuthenticationMiddleware = (papers) => {

  const authenticationMiddleware = (req, res, next) => {
    /********* add convenience methods to req *************/
    req.logOut = papers.functions.logOut(req, papers.options.userProperty, papers.options.key);
    req.isAuthenticated = papers.functions.isAuthenticated(req);

    /********* check session for auth *************/
    const iterator = papers.koa2 ? strategyIterator.asyncIterator :  strategyIterator.coIterator;
    iterator(req, res, papers)
      .then((result) => {
      switch(result.type) {
        case 'customHandler': {
          return papers.functions.customHandler(req, res, next, result.value);
        }
        case 'error': {
          return next(result.value.exception);
        }
        case 'failWithError': {
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
      res.statusCode = 500;
      return res.end(`${http.STATUS_CODES[500]} \n ${ex.message} \n ${ex}`);
    })
  };

  // I feel like this should be in a separate module but I need the closure for papers
  if(papers.koa === true) {
    return function *(next) {
      authenticationMiddleware(this.request, this.response, next);
    }
  }else if(papers.koa2 === true) {
    return async function (ctx, next) {
      authenticationMiddleware(ctx.request, ctx.response, next);
    }
  } else {
    return authenticationMiddleware;
  }
};

module.exports = createAuthenticationMiddleware;