var papers = require('./../src/Papers');
var request = require('./helpers/request');
var response = require('./helpers/response');
var strategy = require('./helpers/testStrategy');
var chai = require('chai');
var expect = chai.expect;
chai.should();

describe('CUSTOM_HANDLER', () => {
  describe('when_fail_is_called_with_customHander', () => {
    let SUT = undefined;
    let req;
    let res;
    let nextArg;
    let customHandlerArg;
    beforeEach(() => {
      req = request();
      res = response();
      var stratResult = {type: 'fail', details: {error:'failed auth'}};
      var myStrategy = strategy(stratResult);
      var config = {
        strategies: [myStrategy],
        customHandler: (result) => {
          customHandlerArg = result;
        }
      };
      SUT = papers().registerMiddleware(config);
      SUT(req, res, ()=> {nextArg='next called'});
    });

    it('should_pass_result_to_handler', () => {
      customHandlerArg.should.eql(stratResult);
    });

    it('should_call_next', () => {
      nextArg.should.equal('next called')
    });
  });
});