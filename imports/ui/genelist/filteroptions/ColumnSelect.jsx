import React from 'react';

const ColumnSelect = ({attributes, selectedColumns, toggleColumnSelect, ...props}) => {
  console.log(props)
  return (
    <div className='btn-group'>
      <button type='button' className='btn btn-sm btn-outline-dark dropdown-toggle' data-toggle='dropdown'>
        Columns
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {
          attributes.map(attribute => {
            return (
              <a key={attribute.name} className={`dropdown-item`}>
                {attribute.name}
              </a>
            )
          })
        }
      </div>
    </div>
  )
}

export default ColumnSelect;