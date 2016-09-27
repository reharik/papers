var papers = require('./../src/Papers');
var request = require('./helpers/request');
var response = require('./helpers/response');
var strategy = require('./helpers/testStrategy');
var chai = require('chai');
var expect = chai.expect;
chai.should();

describe('MULTIPLE_SUCCESS_RESPONSES', () => {
  describe('when_multiple_strategies_would_call_success', () => {
    let SUT = undefined;
    let req;
    let res;
    beforeEach(() => {
      req = request();
      res = response();
      var myStrategy = strategy({type:'success', details:{user:{name:'frank'}}});
      var myStrategy1 = strategy({type:'success', details:{user:{name:'frank1'}}});
      var myStrategy2 = strategy({type:'success', details:{user:{name:'frank2'}}});
      var config = {
        strategies: [myStrategy, myStrategy1, myStrategy2]
      };
      SUT = papers().registerMiddleware(config);
      SUT(req, res, ()=>{});
    });

    it('should_set_res_status_to_200', () => {
      res.statusCode.should.equal(200);
    });

    it('should_put_first_success_on_req_and_not_process_others', () => {
      req.user.name.should.equal('frank');
      req.user.name.should.not.equal('frank1');
    });
  });

  describe('when_fail_is_called_and_then_success', () => {
    let SUT = undefined;
    let req;
    let res;
    beforeEach(() => {
      req = request();
      res = response();
      var myStrategy = strategy({type:'fail', details:{error:'something went wrong!', status:402}});
      var myStrategy1 = strategy({type:'fail', details:{error:'something went wrong!1', status:500}});
      var myStrategy2 = strategy({type:'success', details:{user:{name:'frank2'}}});
      var config = {
        strategies: [myStrategy, myStrategy1, myStrategy2]
      };
      SUT = papers().registerMiddleware(config);
      SUT(req, res, ()=>{});
    });

    it('should_set_res_status_to_200', () => {
      res.statusCode.should.equal(200);
    });

    it('should_put_first_success_on_req', () => {
      req.user.name.should.equal('frank2');
    });
  });


});