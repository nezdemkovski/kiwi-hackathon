import ApiBuilder from 'claudia-api-builder';
import denodeify from 'denodeify';
import Axios from 'axios';
import fs from 'fs';
const api = new ApiBuilder();

const BASE_URL = 'https://api.sygictravelapi.com/0.2/en';
const PLACES = '/places/list';

const sygicApi = Axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'nSCQiwW9R88zlr0P7J2VocUXBnKejmO26m9eIUl8',
  },
});

// just return the result value for synchronous processing
api.get('/hello', function() {
  return 'hello world';
});

// pass some arguments using the query string or headers to this
// method and see that they're all in the request object
api.get('/echo', function(request) {
  return request;
});

// use {} for dynamic path parameters
api.get('/places/{tag}', request => {
  const tag = request.pathParams.tag;

  return sygicApi.get(`${PLACES}?tags=${tag}`).then(
    success => {
      return success.data;
    },
    error => {
      return error;
    },
  );
});

// Return a promise for async processing
api.get('/packagejson', function() {
  const read = denodeify(fs.readFile);
  return read('./package.json').then(JSON.parse).then(function(val) {
    return val;
  });
});

// use .post to handle a post; or .delete, .patch, .head, .put
api.post('/echo', function(request) {
  return request;
});

module.exports = api;
