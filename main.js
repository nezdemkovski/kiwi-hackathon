import ApiBuilder from 'claudia-api-builder';
import denodeify from 'denodeify';
import Axios from 'axios';
import flatMap from 'lodash.flatmap';
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

api.get('/places', request => {
  const { tags } = request.proxyRequest.queryStringParameters;

  return Promise.all(
    tags.split(',').map(it => sygicApi.get(`${PLACES}?tags=${it}`)),
  ).then(values => {
    console.log(values);
    return flatMap(values, it => {
      const { places } = it.data.data;

      return places.map(it => {
        {
          return {
            id: it.id,
            rating: it.rating,
            location: it.location,
            name: it.name,
            city: it.name_suffix.split(',')[0],
            country: it.name_suffix.split(',')[1],
            marker: it.marker,
            categories: it.categories,
            perex: it.perex,
          };
        }
      });
    });
  });
});

api.get('/packagejson', () => {
  const read = denodeify(fs.readFile);
  return read('./package.json').then(JSON.parse).then(val => {
    return val;
  });
});

api.post('/echo', request => {
  return request;
});

module.exports = api;
