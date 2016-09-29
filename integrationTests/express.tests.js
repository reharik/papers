var express = require('express');
var app = express();
var setups = require('./setups');



var strat = setups.failureRedirect(app);
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