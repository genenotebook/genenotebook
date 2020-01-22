import React from 'react';

import GenomeSelect from './GenomeSelect.jsx';
import ColumnSelect from './ColumnSelect.jsx';

import './filteroptions.scss';

export default function FilterOptions({
  attributes,
  selectedColumns,
  toggleColumnSelect,
  selectedVisualization,
  toggleVisualization,
  query,
  updateQuery,
}) {
  return (
    <div className="btn-group" role="group">
      <button
        type="button"
        className="btn btn-sm btn-outline-dark px-2 py-0 border filter-options"
        disabled
      >
        Select:
      </button>
      <GenomeSelect {...{ query, updateQuery }} />
      <ColumnSelect
        {...{
          attributes,
          selectedColumns,
          toggleColumnSelect,
          selectedVisualization,
          toggleVisualization,
        }}
      />
    </div>
  );
}
