var state = require('./authenticatorState');
var authenticationMiddleware = require('./middlewareFactories/authenticationMiddleware');
var initializationMiddleware = require('./middlewareFactories/initializationMiddleware');
var requestDecorator = require('./requestDecorator');

module.exports = class Authenticator {
  constructor() {
    this.strategies = {};
    this.serializers = [];
    this.deserializers = [];
    this.infoTransformers = [];
    this.userProperty = 'user';
    this.key = 'papers';
  }
  
  use(name, strategy) {
    if (!name) { throw new Error('Authentication strategies must have a name'); }

    this.strategies[name] = strategy;
    return this;
  }
  
  unuse(name){
    delete this.strategies[name];
    return this;
  }

/*
 app.post('/login',
 papers.createAuthenticateMiddleware('local', { failureRedirect: '/login' }),
 authController.login
 );
*/

  createAuthenticationMiddleware(_strategies, clientOptions){
    let papersOptions = {
      key: this.key,
      userProperty: this.userPropery
    }; 
    const strategiesArray = Array.isArray(_strategies) ? _strategies : [_strategies];
    const strategies = strategiesArray.map(name => this.strategies[name]);
    return authenticationMiddleware(strategies, clientOptions, papersOptions);
  }

  createInitializationMiddleware(){
    return initializationMiddleware(this, requestDecorator);
  }

  registerSerializeUserFunction (fn) {
    if (typeof fn === 'function') {
      return this.serializers.push(fn);
    }
  };

  serializeUser(user) {
    // private implementation that traverses the chain of serializers, attempting
    // to serialize a user
    for (let i = 0; this.serializers.length; i++) {

      var layer = this.serializers[i];
      if (!layer) {
        throw new Error('Failed to serialize user into session');
      }

      try {
        const result = layer(user);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }

    }
  };
  
  registerDeserializeUserFunction (fn) {
    if (typeof fn !== 'function') {
      throw new Error('Deserialization function must be a function');
    }
    this.deserializers.push(fn);
  };

  deserializeUser(user) {
    for (let i = 0; this.deserializers; i++) {

      var layer = this.deserializers[i];
      if (!layer) {
        throw new Error('Failed to serialize user into session');
      }

      try {
        const result = layer(user);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }
    }
  };

  registerTransformAuthInfoFunction (fn)
  {
    if (typeof fn !== 'function') {
      throw new Error('TransformAuthInfo function must be a function');
    }
    this.infoTransformers.push(fn);
  };

  transformAuthInfo (info){
    for (let i = 0; this.infoTransformers; i++) {

      var layer = this.infoTransformers[i];
      if (!layer) {

        // if no transformers are registered (or they all pass), the default
        // behavior is to use the un-transformed info as-is
        return info;
      }

      try {
        const result = layer(info);
        if (result !== 'pass') {
          return result;
        }
      } catch (e) {
        throw(e);
      }
    }
  };

};