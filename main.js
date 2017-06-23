/*global require, module*/
var ApiBuilder = require('claudia-api-builder'),
  api = new ApiBuilder(),
  fs = require('fs'),
  denodeify = require('denodeify'),
  axios = require('axios');
module.exports = api;

const BASE_URL = 'https://api.sygictravelapi.com/0.2/en';
const PLACES = '/places/list';

// just return the result value for synchronous processing
api.get('/hello', function() {
  return 'hello world';
});

// pass some arguments using the query string or headers to this
// method and see that they're all in the request object
api.get('/echo', function(request) {
  return request;
});

// use request.queryString for query arguments
api.get('/greet', function(request) {
  return request.queryString.name + ' is ' + superb();
});

// use {} for dynamic path parameters
api.get('/places/{tag}', function(request) {
  const tag = request.pathParams.tag;
  console.log('Looking for tag', tag);
  axios.get(BASE_URL + PLACES + '?tags=' + tag).then(resp => resp);
});

// Return a promise for async processing
api.get('/packagejson', function() {
  var read = denodeify(fs.readFile);
  return read('./package.json').then(JSON.parse).then(function(val) {
    return val;
  });
});

// use .post to handle a post; or .delete, .patch, .head, .put
api.post('/echo', function(request) {
  return request;
});
