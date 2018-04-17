import React from 'react';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

const ColumnSelect = ({attributes, selectedColumns, toggleColumnSelect, ...props}) => {
  console.log(selectedColumns)
  return (
    <Dropdown>
      <DropdownButton className='btn btn-sm btn-outline-dark dropdown-toggle'>
        Columns&nbsp;
        <span className='badge badge-dark'>
          {`${selectedColumns.size}/${attributes.length}`}
        </span>
      </DropdownButton>
      <DropdownMenu>
        <h6 className="dropdown-header">Attributes</h6>
        {
          attributes.map(attribute => {
            const { name } = attribute;
            const checked = selectedColumns.has(name)
            return (
              <div key={`${name}${checked}`} className='form-check'>
                <input type='checkbox' className='form-check-input' id={name}
                  checked={checked} onChange={toggleColumnSelect} />
                <label className='form-check-label'>{name}</label>
              </div>
            )
          })
        }
        <div className="dropdown-divider" />
        <h6 className="dropdown-header">Data visualizations</h6>
        <a className='dropdown-item'>Gene model</a>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ColumnSelect;

