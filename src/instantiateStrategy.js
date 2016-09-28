
//TODO do we even want to facilitate this?
module.exports = (strat) => {
  switch(typeof strat) {
    case 'function': {
      return strat();
    }
    case 'class': {
      return new Strat();
    }
    default: {
      return strat;
    }
  }
};

