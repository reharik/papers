var express = require('express');
var app = express();
var papersLocal = require('papers-local');
var papers = require('./../src/Papers');
var request = require('supertest');

var chai = require('chai');
var expect = chai.expect;
chai.should();

var basicSuccess = (app) => {

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

describe('SUCCESS', ()=> {
  describe('when_stratedy_is_successful', ()=> {
    var SUTRequest;
    before(() => {
      app.use(basicSuccess(app));
      app.get("/", function (req, res) {
        SUTRequest = req;
        res.send("end");
      });
    });

    it("should_put_user_on_request", (done) => {
      request(app)
        .get('/')
        .expect((res)=> {
          SUTRequest.user.name.should.equal('bubba');
        })
        .expect(200, done)
    })
  })
});