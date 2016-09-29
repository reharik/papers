var express = require('express');
var app = express();
var papersLocal = require('papers-local');
var papers = require('./../src/Papers');


var basicSuccess = () => {

  var strategy = papersLocal(() => {
    return Promise.resolve({user: {name: 'bubba'}})
  });

  var papersConfig = {
    strategies: [strategy]
  };

  app.use(function (req, res, next) {
    req.body = {username:'bubba', password:'likesit'};
    next()
  });

  return papers(papersConfig).registerMiddleware(papersConfig);
};



var strat = basicSuccess();
app.use(strat);

app.get("/", function(req, res) {
  console.log('==========req=========');
  console.log(req.user);
  console.log('==========END req=========');
  console.log('==========req.isAuthenticated=========');
  console.log(req.isAuthenticated());
  console.log('==========END req=========');
  req.logOut();
  console.log('==========logged out req=========');
  console.log(req.user);
  console.log('==========END req=========');

});

app.listen(3000);