

module.exports = (papers, req) => {
  /********* check session for auth *************/
  if(papers.options.useSession
    && req.session[papers.options.key]
    && req.session[papers.options.key].user) {
    try {

      //TODO put in generator
      const user = papers.functions.deserializeUser(req.session[papers.options.key].user, papers);

      if (!user) {
        delete req.session[papers.options.key].user;
        return false;
      } 
        req[papers.options.userProperty] = user;
        return true;
    } catch (ex) {
      throw new Error("Error thrown during deserialization of user.");
    }
  }
}