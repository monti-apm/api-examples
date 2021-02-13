import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const dateFormat = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
const columns = [
  { id: 'time', name: 'Date' },
  { id: 'method', name: 'Name' },
  { id: 'total', name: 'Total Time' },
  { id: 'wait', name: 'Wait Time' },
  { id: 'db', name: 'DB Time' },
  { id: 'compute', name: 'Compute Time' },
  { id: 'http', name: 'HTTP Time' },
  { id: 'email', name: 'Email Time' },
  { id: 'async', name: 'Async Time' }
];

export default function Traces({
  traces,
  onSelectTrace,
  sortColumn,
  onSelectColumn
}) {

  const sortedTraces = useMemo(() => {
      return sortTraces(traces, sortColumn)
    },
    [traces, sortColumn]
  );

  return (
    <div>
      <h1>Method Trace Explorer</h1>
      <p>Showing {traces.length} newest traces.</p>
      <p>Click on a column to sort.</p>
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                onClick={() => onSelectColumn(column.id)}
                className={column.id === sortColumn ? 'selected' : ''}
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTraces.map(trace => (
            <tr onClick={() => onSelectTrace(trace.id)} key={trace.id}>
              <td>{new Date(trace.time).toLocaleDateString('en-US', dateFormat)}</td>
              <td>{trace.method}</td>
              <td className="metric">{trace.metrics.total}</td>
              <td className="metric">{trace.metrics.wait}</td>
              <td className="metric">{trace.metrics.db}</td>
              <td className="metric">{trace.metrics.compute}</td>
              <td className="metric">{trace.metrics.http}</td>
              <td className="metric">{trace.metrics.email}</td>
              <td className="metric">{trace.metrics.async}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Traces.propTypes = {
  traces: PropTypes.array,
  onSelectTrace: PropTypes.func,
  sortColumn: PropTypes.string,
  onSelectColumn: PropTypes.func
};

function sortTraces(traces, column) {
  if (!column || traces.length === 0) {
    return traces;
  }

  if (typeof traces[0][column] === 'string') {
    return traces.slice().sort((trace1, trace2) => {
      if (trace1[column] < trace2[column]) {
        return -1;
      }
      if (trace1[column] > trace2[column]) {
        return 1;
      }

      return 0;
    });
  }

  if (traces[0][column]) {
    return traces.slice().sort((trace1, trace2) => trace2[column] - trace1[column]);
  }

  return traces.slice().sort((trace1, trace2) => trace2.metrics[column] - trace1.metrics[column]);
}
