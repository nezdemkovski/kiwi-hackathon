import ApiBuilder from 'claudia-api-builder';
import denodeify from 'denodeify';
import Axios from 'axios';
import fs from 'fs';
const api = new ApiBuilder();

const BASE_URL = 'https://api.sygictravelapi.com/0.2/en';
const PLACES = '/places/list';
const SOURCE = 'prague';
const FLIGHTS_API = 'https://api.skypicker.com/flights';
// https://api.skypicker.com/flights?flyFrom=CZ&to=porto&directFlights=true&sort=price&asc=1

const sygicApi = Axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'nSCQiwW9R88zlr0P7J2VocUXBnKejmO26m9eIUl8'
  }
});

api.get('/hello', () => {
  return 'hello world';
});

api.get('/echo', request => {
  return request;
});

api.get('/places', request => {
  const { tags } = request.proxyRequest.queryStringParameters;

  return Promise.all(
    tags.split(',').map(it => sygicApi.get(`${PLACES}?tags=${it}`))
  ).then(values => {
    console.log(values);
    return values.map(it => {
      const { places } = it.data.data;
      return places;
      // return places.map(it => it.name_suffix.split(',')[0]);
    });
  });
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

const flightsUrl = (from, to) =>
  `${FLIGHTS_API}?flyFrom=${from}&to=${to}&directFlights=true&sort=price&asc=1`;

module.exports = api;
