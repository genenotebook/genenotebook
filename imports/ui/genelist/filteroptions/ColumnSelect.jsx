import React from 'react';

const ColumnSelect = ({attributes, selectedColumns, toggleColumnSelect, ...props}) => {
  console.log(props)
  return (
    <div className='btn-group'>
      <button type='button' className='btn btn-sm btn-outline-dark dropdown-toggle' data-toggle='dropdown'>
        Columns&nbsp;
        <span className='badge badge-dark'>
          {`${selectedColumns.size}/${attributes.length}`}
        </span>
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
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
      </div>
    </div>
  )
}

export default ColumnSelect;