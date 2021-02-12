#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs');
const { GraphQLClient } = require('graphql-request');
const asciichart = require('asciichart');

const argv = yargs
  .string('appId')
  .describe('appId', 'App ID from Monti APM')
  .string('secret')
  .describe('secret', 'App secret from Monti APM')
  .argv;

if (!argv.appId || !argv.secret) {
  console.error('app id or secret is missing. Please use the --help option for instructions');
  process.exit(1);
}

async function init() {
  // First, we need to get a JWT token for this app
  const token = await getToken(argv.appId, argv.secret);
  // Second, we send a GraphQL query to get the app's metrics
  const data = await getData(token);
  // Lastly, we display the data to the user
  display(data);
}

init();

async function getToken (appId, secret) {
  try {
    const { data: token } = await axios.post('https://api.montiapm.com/auth', {
      appId,
      appSecret: secret,
      schema: 'core'
    });

    return token;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('The app id or app secret are not valid.');
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

async function getData (token) {
  const endpoint = 'https://api.montiapm.com/core';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: token
    }
  });

  const ONE_HOUR = 1000 * 60 * 60 * 1;
  const start = new Date(Date.now() - ONE_HOUR).getTime();
  const query = `
  {
    ram: meteorSystemMetrics (metric: RAM_USAGE, startTime: ${start}, resolution: RES_1MIN){
      points
    }

    cpu: meteorSystemMetrics (metric: CPU_USAGE, startTime: ${start}, resolution: RES_1MIN){
      points
    }

    sessions: meteorSystemMetrics (metric: SESSIONS, startTime: ${start}, resolution: RES_1MIN){
      points
    }

    errors: meteorErrorMetrics (metric: ERROR_COUNT, startTime: ${start}, resolution: RES_1MIN){
      points
    }

    throughput: meteorMethodMetrics (metric: THROUGHPUT, startTime: ${start}, resolution: RES_1MIN){
      points
    }
  }
  `;

  return graphQLClient.request(query);
}

function displayChart (points) {
  points = points.map(point => {
    // Points are null when there is no data
    // This could be because the app was not running or connected to Monti APM
    // Or Monti APM hasn't processed the metrics yet
    // (there is usually a 30-60 second delay)
    if (point === null) {
      return 0;
    }

    return point;
  });

  console.log(asciichart.plot(points, { height: 6 }));
}

function display (data) {
  const currentRam = currentValue(data.ram[0].points);
  const currentCpu = currentValue(data.cpu[0].points);
  const currentSessions = currentValue(data.sessions[0].points);
  const currentErrors = currentValue(data.errors[0].points);
  const currentMethods = currentValue(data.throughput[0].points);

  console.log('Ram           current: ', currentRam, 'mb');
  displayChart(data.ram[0].points);
  console.log('\n');

  console.log('CPU           current: ', currentCpu, '%');
  displayChart(data.cpu[0].points);
  console.log('\n');

  console.log('Sessions      current: ', currentSessions);
  displayChart(data.sessions[0].points);
  console.log('\n');

  console.log('Errors        current: ', currentErrors);
  displayChart(data.errors[0].points || []);
  console.log('\n');

  console.log('Methods       current: ', currentMethods, 'req/minute');
  displayChart(data.throughput[0].points);
}

function prepareData (rawPoints) {
  let points = rawPoints.map(point => point === null ? 0 : point);

  // If Monti APM hasn't processed the data for the last minute,
  // we can ignore its value.
  if (rawPoints[rawPoints.length - 1] === null) {
    points = points.slice(0, -1);
  }

  return points;
}

function currentValue (rawPoints) {
  const points = prepareData(rawPoints);
  const lastValue = points[points.length - 1];

  // Limit the number to two decimal places
  return ` ${Math.floor(lastValue * 100) / 100}`;
}
