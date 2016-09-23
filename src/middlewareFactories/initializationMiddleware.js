

module.exports = function initialize(papers, requestDecorator) {

  return function initialize(req, res, next) {
    req = requestDecorator(req);
    req._papers = {};
    req._papers.instance = papers;

    if (req.session && req.session[papers.key]) {
      // load data from existing session
      req._papers.session = req.session[papers.key];
    }

    next();
  };
};