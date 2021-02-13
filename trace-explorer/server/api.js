import axios from 'axios';
import { Meteor } from 'meteor/meteor';
import { GraphQLClient } from 'graphql-request';

const HOUR = 1000 * 60 * 60;
const baseUrl = 'https://api.montiapm.com';
const { appId, appSecret } = Meteor.settings;
let jwtToken;

Meteor.startup(async () => {
  await updateToken(appId, appSecret);

  // Update token every hour so it never expires
  setInterval(() => {
    updateToken(appId, appSecret);
  }, HOUR);
});

export async function updateToken(appId, appSecret) {
  try {
    const { data: token } = await axios.post(`${baseUrl}/auth`, {
      appId,
      appSecret,
      schema: 'core'
    });

    jwtToken = token;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('The app id or app secret are not valid. Please check their values in the settings.json file.');
    } else {
      console.error(error);
    }
  }
}

export async function executeQuery(query) {
  const endpoint = `${baseUrl}/core`;
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: jwtToken
    }
  });

  return graphQLClient.request(query);
}
