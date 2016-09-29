
module.exports = (papers, req) => {
  /********* check session for auth *************/
  if (papers.options.useSession
      && req.session[papers.options.key]
      && req.session[papers.options.key].user) {

    papers.functions.deserializeUser(req.session[papers.options.key].user, papers)
        .then(result => {
          const user = result;
            console.log('==========user=========');
            console.log(user);
            console.log('==========END user=========');
          if (!user) {
            delete req.session[papers.options.key].user;
            return false;
          }
          req[papers.options.userProperty] = user;
          return true;
        }).catch(ex => {
        console.log('=========="here"=========');
        console.log("here");
        console.log('==========END "here"=========');
      throw new Error("Error thrown during deserialization of user.");
    });
  }
};