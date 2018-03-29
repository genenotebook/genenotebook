import React from 'react';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

const ColumnSelect = ({attributes, selectedColumns, toggleColumnSelect, ...props}) => {
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
            const active = selectedColumns.has(attribute.name) ? 'active' : ''
            return (
              <a key={attribute.name} 
                className={`dropdown-item ${active}`}
                id={attribute.name}
                onClick={toggleColumnSelect.bind(this)} >
                {attribute.name}
              </a>
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