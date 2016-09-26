
var papers = require('./../src/Papers');
var request = require('./helpers/request');
var response = require('./helpers/response');
var strategy = require('./helpers/testStrategy');
var chai = require('chai');
var expect = chai.expect;
chai.should();

describe('ERROR_RESPONSE', () => {
  describe('when_error_is_called_by_strategy', () => {
    let SUT = undefined;
    let req;
    let res;
    let nextArg;
    beforeEach(() => {
      req = request();
      res = response();
      var next = (arg) => {
        nextArg = arg;
      };
      var myStrategy = strategy({type:'error', details: {error: 'some error'}});
      var config = {
        strategies: [myStrategy]
      };
      SUT = papers().registerMiddleware(config);
      SUT(req, res, next);
    });

    it('should_call_next_with_error', () => {
      nextArg.errorMessage.should.equal('some error')
    });

    it('should_not_call_end', () => {
      res.endWasCalled.should.be.false
    });

  });
});
