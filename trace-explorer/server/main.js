import { Meteor } from 'meteor/meteor';
import { executeQuery } from './api';

const { appId, appSecret } = Meteor.settings;

if (!appId && !appSecret) {
  console.log('appId and appSecret are missing in Meteor.settings');
  console.log('Make sure you ran meteor with the `--settings ./settings.json` option');
  console.log('And the settings.json file has the appId and secret for your app');
  process.exit(1);
}

Meteor.methods({
  async 'traces.all' () {
    const query = `
      {
        traces: meteorMethodTraces(startTime: 0, limit: 1000, sortOrder: DSC) {
          id
          method
          type
          time
          metrics {
            total
            wait
            db
            compute
            http
            email
            async
          }
        }
      }
    `;

    const { traces } = await executeQuery(query);

    return traces;
  },
  async 'traces.one' (traceId) {
    const query = `
      {
        trace: meteorMethodTrace(traceId: "${traceId}") {
          method
          id
          events
        }
      }
    `;

    const { trace } = await executeQuery(query);

    trace.events = JSON.parse(trace.events);

    return trace;
  }
});
