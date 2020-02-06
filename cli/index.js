#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs');
const { GraphQLClient } = require('graphql-request');
const sparkly = require('sparkly');

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

async function getToken (appId, secret) {
  const { data: token } = await axios.post('https://api.montiapm.com/auth', {
    appId,
    appSecret: secret,
    schema: 'core'
  });

  return token;
}

async function getData (token) {
  const endpoint = 'https://api.montiapm.com/core';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: token
    }
  });
  const EIGHT_HOURS = 1000 * 60 * 60 * 8;
  const start = new Date(Date.now() - EIGHT_HOURS).getTime();
  const query = `
  {
    ram: meteorSystemMetrics (metric: RAM_USAGE, startTime: ${start}, resolution: RES_30MIN){
      points
    }

    cpu: meteorSystemMetrics (metric: CPU_USAGE, startTime: ${start}, resolution: RES_30MIN){
      points
    }

    sessions: meteorSystemMetrics (metric: SESSIONS, startTime: ${start}, resolution: RES_30MIN){
      points
    }

    errors: meteorErrorMetrics (metric: ERROR_COUNT, startTime: ${start}, resolution: RES_30MIN){
      points
    }

    throughput: meteorMethodMetrics (metric: THROUGHPUT, startTime: ${start}, resolution: RES_30MIN){
      points
    }
  }
  `;

  return graphQLClient.request(query);
}

function display (data) {
  console.log('Ram     ', sparkLine(data.ram[0].points), currentValue(data.ram[0].points), 'mb');
  console.log('');
  console.log('CPU     ', sparkLine(data.cpu[0].points), currentValue(data.cpu[0].points), '%');
  console.log('');
  console.log('Sessions', sparkLine(data.sessions[0].points), currentValue(data.sessions[0].points));
  console.log('');
  console.log('Errors  ', sparkLine(data.errors[0].points), currentValue(data.errors[0].points));
  console.log('');
  console.log('Methods ', sparkLine(data.throughput[0].points), currentValue(data.throughput[0].points), 'req/minute');
}

async function init () {
  const token = await getToken(argv.appId, argv.secret);
  const data = await getData(token);

  display(data);
}

init();

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

  return ` ${Math.floor(lastValue * 100) / 100}`;
}

function sparkLine (rawPoints) {
  const points = prepareData(rawPoints);

  return sparkly(points);
}
