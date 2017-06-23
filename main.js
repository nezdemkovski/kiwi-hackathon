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

api.get('/hello', () => {
  return 'hello world';
});

api.get('/echo', request => {
  return request;
});

api.get('/places/{tag}', request => {
  const { tag } = request.pathParams;

  return sygicApi.get(`${PLACES}?tags=${tag}`).then(
    success => {
      return success.data;
    },
    error => {
      return error;
    },
  );
});

api.get('/packagejson', () => {
  const read = denodeify(fs.readFile);
  return read('./package.json').then(JSON.parse).then(function(val) {
    return val;
  });
});

api.post('/echo', request => {
  return request;
});

module.exports = api;
