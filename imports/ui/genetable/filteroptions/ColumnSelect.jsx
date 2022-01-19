import React from 'react';

import { VISUALIZATIONS } from '/imports/ui/genetable/GeneTable.jsx';

export default function ColumnSelect({
  attributes,
  selectedColumns,
  toggleColumnSelect,
  selectedVisualization,
  toggleVisualization,
}) {
  return (
    <div className="dropdown is-hoverable columnselect">
      <div className="dropdown-trigger">
        <button type="button" className="button is-small">
          Columns
          <span className="icon-down" />
        </button>
      </div>
      <div className="dropdown-menu" role="menu">
        <div className="dropdown-content">
          <div className="dropdown-item">
            <h6 className="is-h6 dropdown-item dropdown-header">
              Attributes
            </h6>
            {attributes.map((attribute) => {
              const { name } = attribute;
              const checked = selectedColumns.has(name);
              return (
                <div key={`${name} ${checked}`}>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      className="dropdown-checkbox is-small"
                      id={name}
                      checked={checked}
                      onChange={toggleColumnSelect}
                    />
                    {name}
                  </label>
                </div>
              );
            })}
          </div>
          <hr className="dropdown-divider" />
          <div className="dropdown-item">
            <h6 className="is-h6 dropdown-item dropdown-header">
              visualizations
            </h6>
            {VISUALIZATIONS.map((visualization) => {
              const checked = selectedVisualization === visualization;
              const disabled = false; // visualization === 'Gene expression';
              return (
                <div key={`${visualization} ${checked}`}>
                  <label className="radio">
                    <input
                      type="radio"
                      className="dropdown-radio is-small"
                      id={visualization}
                      checked={checked}
                      disabled={disabled}
                      onChange={toggleVisualization}
                    />
                    {visualization}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
