import { Meteor } from 'meteor/meteor';
import Trace from './Trace';
import Traces from './Traces';
import React, { useEffect, useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [traces, setTraces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sortColumn, setSortColumn] = useState('time');

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    Meteor.call('traces.all', (err, traces = []) => {
      if (canceled) {
        return;
      }

      setLoading(false);
      setTraces(traces);
      setError(err);
    });

    return () => canceled = true;
  }, []);

  let content;
  let errorMessage;
  if (loading) {
    content = <p>Loading...</p>;
  } else {
    content = (
      <Traces
        loadTraces={this.loadTraces}
        sortColumn={sortColumn}
        onSelectColumn={column => setSortColumn(column)}
        traces={traces}
        onSelectTrace={traceId => setSelected(traceId)}
      />
    );
  }

  if (error) {
    errorMessage = error.message ? error.message : error;
  }

  return (
    <div>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {selected && <Trace traceId={selected} onClose={() => setSelected(null)} />}
      {content}
    </div>
  );
}
