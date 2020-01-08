import React from 'react';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { VISUALIZATIONS } from '/imports/ui/genetable/GeneTable.jsx';

export default function ColumnSelect({
  attributes,
  selectedColumns,
  toggleColumnSelect,
  selectedVisualization,
  toggleVisualization,
}) {
  return (
    <Dropdown>
      <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
        Columns&nbsp;
        <span className="badge badge-dark">{`${selectedColumns.size}/${attributes.length}`}</span>
      </DropdownButton>
      <DropdownMenu>
        <h6 className="dropdown-header">Attributes</h6>
        {attributes.map((attribute) => {
          const { name } = attribute;
          const checked = selectedColumns.has(name);
          return (
            <div key={`${name} ${checked}`} className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id={name}
                checked={checked}
                onChange={toggleColumnSelect}
              />
              <label className="form-check-label">{name}</label>
            </div>
          );
        })}
        <div className="dropdown-divider" />
        <h6 className="dropdown-header">Data visualization</h6>
        {VISUALIZATIONS.map((visualization) => {
          const checked = selectedVisualization === visualization;
          const disabled = false; // visualization === 'Gene expression';
          return (
            <div key={`${visualization} ${checked}`} className="form-check">
              <input
                type="radio"
                className="form-check-input"
                id={visualization}
                checked={checked}
                disabled={disabled}
                onChange={toggleVisualization}
              />
              <label className="form-check-label">{visualization}</label>
            </div>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
