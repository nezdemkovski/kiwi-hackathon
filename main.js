import fs from 'fs';
import 'isomorphic-fetch';
import ApiBuilder from 'claudia-api-builder';
import denodeify from 'denodeify';
import Axios from 'axios';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import gql from 'graphql-tag';
import flatMap from 'lodash.flatmap';
import _ from 'lodash';
const api = new ApiBuilder();

const opts = {
  uri: 'https://2z448ylj8d.execute-api.eu-west-1.amazonaws.com/hackathon'
};
const networkInterface = createNetworkInterface(opts);

const BASE_URL = 'https://api.sygictravelapi.com/0.2/en';
const PLACES = '/places/list';
const PLACES_SHORT = '/places';
const SOURCE = 'prague';
const FLIGHTS_API = 'https://api.skypicker.com/flights';
// https://api.skypicker.com/flights?flyFrom=CZ&to=porto&directFlights=true&sort=price&asc=1
// errorMessage: "GraphQL error: Internal Server Error GraphQL error: Internal Server Error GraphQL error: Internal Server Error GraphQL error: Internal Server Error"

const sygicApi = Axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'nSCQiwW9R88zlr0P7J2VocUXBnKejmO26m9eIUl8'
  }
});

const flightsClient = new ApolloClient({
  networkInterface
});

const createVariables = (lat, lng, location) => {
  return {
    search: {
      from: {
        radius: {
          // Prague
          lat: 50.08,
          lng: 14.44,
          radius: 100
        }
      },
      to: {
        radius: {
          lat,
          lng,
          radius: 100
        }
      },
      dateFrom: '2017-12-24',
      dateTo: '2017-12-30'
    }
  };
};

api.get('/hello', () => {
  return 'hello world';
});

api.get('/echo', request => {
  return request;
});

api.get('/places', (request, ctx) => {
  const { tags } = request.proxyRequest.queryStringParameters;

  const totalTags = tags.split('|').length;

  return sygicApi.get(`${PLACES}?tags=${tags}&limit=500`).then(value => {
    const pois = value.data.data.places.map(it => {
      {
        return {
          id: it.id,
          rating: it.rating,
          location: it.location,
          name: it.name,
          city: it.name_suffix && it.name_suffix.split(', ')[0],
          country: it.name_suffix && it.name_suffix.split(', ')[1],
          marker: it.marker,
          categories: it.categories,
          perex: it.perex
        };
      }
    });

    const poiRequestQuery = pois.map(it => it.id).join('%7C');
    return sygicApi.get(`${PLACES_SHORT}?ids=${poiRequestQuery}`).then(resp => {
      const filteredTags = resp.data.data.places
        .filter(it => {
          return (
            it.tags.filter(it => {
              const index = tags.toLowerCase().indexOf(it.key.toLowerCase());
              return index > -1;
            }).length >= totalTags
          );
        })
        .map(it => it.id);
      const filteredPois = pois.filter(it => filteredTags.indexOf(it.id) > -1);
      const groupedByCity = filteredPois.reduce((acc, curr) => {
        if (!acc[curr.city]) {
          acc[curr.city] = {
            places: [curr],
            lat: curr.location.lat,
            lng: curr.location.lng
          };
          return acc;
        }
        acc[curr.city].places.push(curr);
        return acc;
      }, {});

      return {
        cities: groupedByCity,
        total: Object.keys(groupedByCity).length
      };
    });
  });
});

api.get('/flights', request => {
  const { lat, lng } = request.proxyRequest.queryStringParameters;
  return flightsClient
    .query({
      query,
      variables: createVariables(parseFloat(lat), parseFloat(lng))
    })
    .then(result => {
      return result.data.allFlights.edges.map(it => {
        return {
          price: it.node.price.amount + ' ' + it.node.price.currency
        };
      });
    });
});

api.get('/cities', request => {
  const { id } = request.proxyRequest.queryStringParameters;
  return sygicApi.get(`${PLACES_SHORT}/${id}`).then(resp => resp.data);
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
