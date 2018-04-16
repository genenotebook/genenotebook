import React from 'react';

import TrackSelect from './TrackSelect.jsx';
import ColumnSelect from './ColumnSelect.jsx';

import './filteroptions.scss';

const FilterOptions = ({ toggleColumnSelect, updateQuery, ...props }) => {
  return (
    <div className='btn-group' role='group'>
      <button className='btn btn-sm btn-outline-dark' disabled>
        Select:
      </button>
      <TrackSelect updateQuery={updateQuery} {...props} />
      <ColumnSelect toggleColumnSelect={toggleColumnSelect} {...props} />
    </div>
  )
}

export default FilterOptions