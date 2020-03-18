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
    <div className="field has-addons" role="group">
      <div className="control">
        <button
          type="button"
          className="button is-small is-static filter-options"
        >
          Select:
        </button>
      </div>
      <div className="control">
        <GenomeSelect {...{ query, updateQuery }} />
      </div>
      <div className="control">
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
    </div>
  );
}
