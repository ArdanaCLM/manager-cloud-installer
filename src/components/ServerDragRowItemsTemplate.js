import React from 'react';

const ServerDragRowsItemTemplate = ({tableRows}) => {
  const rows = tableRows.map(row => (
    <div key={row.id}>{row.name}</div>));
  return (<div>{rows}</div>);
};

export default ServerDragRowsItemTemplate;
