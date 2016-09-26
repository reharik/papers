
module.exports = function(result) {
  return function() {
    var authenticate = function () {
      return result;
    };

    return {
      authenticate
    }
  }
};