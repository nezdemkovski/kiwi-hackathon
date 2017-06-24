import fs from 'fs';
import 'isomorphic-fetch';
import ApiBuilder from 'claudia-api-builder';
import denodeify from 'denodeify';
import Axios from 'axios';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import gql from 'graphql-tag';
import flatMap from 'lodash.flatmap';
const api = new ApiBuilder();

const opts = {
  uri: 'https://2z448ylj8d.execute-api.eu-west-1.amazonaws.com/hackathon',
};
const networkInterface = createNetworkInterface(opts);

const BASE_URL = 'https://api.sygictravelapi.com/0.2/en';
const PLACES = '/places/list';
const SOURCE = 'prague';
const FLIGHTS_API = 'https://api.skypicker.com/flights';
// https://api.skypicker.com/flights?flyFrom=CZ&to=porto&directFlights=true&sort=price&asc=1

const sygicApi = Axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'nSCQiwW9R88zlr0P7J2VocUXBnKejmO26m9eIUl8',
  },
});

const flightsClient = new ApolloClient({
  networkInterface,
});

const createVariables = (lat, lng, location) => {
  return {
    search: {
      from: {
        radius: {
          // Prague
          lat: 50.08,
          lng: 14.44,
          radius: 100,
        },
      },
      to: [{ location }],
      dateFrom: '2017-12-24',
      dateTo: '2017-12-30',
    },
  };
};

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
    const pois = flatMap(values, it => {
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

    return Promise.all(
      pois.map(it => {
        const { lat, lng } = it.location;
        const location = it.city;

        console.log(lat, lng, location);
        return flightsClient.query({
          query,
          variables: createVariables(lat, lng, location),
        });
      }),
    ).then(
      success => {
        console.log('------------------->', success);
        return success;
      },
      error => {
        return error;
      },
    );
  });
});

// api.get('/flights', () => {
//   const flightsClient = new ApolloClient({
//     networkInterface
//   });
//   return flightsClient.query({ query, variables }).then(
//     success => {
//       console.log('------------------->', success);
//       return success;
//     },
//     error => {
//       return error;
//     }
//   );
// });

api.get('/packagejson', () => {
  const read = denodeify(fs.readFile);
  return read('./package.json').then(JSON.parse).then(val => {
    return val;
  });
});

api.post('/echo', request => {
  return request;
});

const flightsUrl = (from, to) =>
  `${FLIGHTS_API}?flyFrom=${from}&to=${to}&directFlights=true&sort=price&asc=1`;

const query = gql`
fragment RouteStop on RouteStop {
  airport {
    city {
      name
    }
    locationId
  }
}
query AllFlights($search: FlightsSearchInput!) {
  allFlights(search: $search, first: 1) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        price {
          amount
          currency
        }
        legs {
          flightNumber
          recheckRequired
          duration
          departure {
            ...RouteStop
          }
          arrival {
            ...RouteStop
          }
          airline {
            name
            code
            logoUrl
            isLowCost
          }
        }
      }
    }
  }
}
`;

module.exports = api;
