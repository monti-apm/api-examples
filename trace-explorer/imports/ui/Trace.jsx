import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import PropTypes from 'prop-types';

export default function Trace({ traceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trace, setTrace] = useState({});

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    Meteor.call('traces.one', traceId, (err, trace = {}) => {
      if (canceled) {
        return;
      }

      setLoading(false);
      setTrace(trace);
      setError(err);
    });

    return () => canceled = true;
  }, []);

  let content;
  if (loading) {
    content = <p>Loading...</p>
  } else if (error) {
    content = <p>Error: {error.message || error}</p>
  } else {
    const {
      events = [],
      method: name = ''
    } = trace;
    content = (
      <>
        <h2>Trace - {name}</h2>
        <ol>
          {events.map((event, i) =>
            <li key={i} className="event">
              {event[0]} - {event[1]}ms
              <pre>{JSON.stringify(event[2], null, 2)}</pre>
            </li>
          )}
        </ol>
      </>
    )
  }

  return (
    <div>
      <div className="overlay" onClick={onClose}>
      </div>
      <div className="window">
        {content}
      </div>
    </div>
  );
}

Trace.propTypes = {
  traceId: PropTypes.string,
  onClose: PropTypes.func
};
