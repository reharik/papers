
module.exports = (papers, req) => {
    /********* check session for auth *************/
    if (papers.options.useSession) {
        req.session[papers.options.key] = req.session[papers.options.key] || {};
        if (req.session[papers.options.key].user) {
            return papers.functions.deserializeUser(req.session[papers.options.key].user, papers)
                .then(result => {
                    const user = result;
                    if (!user) {
                        delete req.session[papers.options.key].user;
                        return {isLoggedIn: false};
                    }
                    req[papers.options.userProperty] = user;
                    return {isLoggedIn: true};
                }).catch(ex => {
                    throw new Error("Error thrown during deserialization of user.");
                });
        }
    }
    return {isLoggedIn: false};
};