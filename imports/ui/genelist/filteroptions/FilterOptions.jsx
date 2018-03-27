import React from 'react';

import ReferenceSelect from './ReferenceSelect.jsx';
import TrackSelect from './TrackSelect.jsx';
import ColumnSelect from './ColumnSelect.jsx';

import './filteroptions.scss';

const FilterOptions = ({ toggleColumnSelect, updateQuery, ...props }) => {
  return (
    <div className='btn-group' role='group'>
      <button className='btn btn-sm btn-outline-dark' disabled>
        Select:
      </button>
      {/*<ReferenceSelect {...props} />*/}
      <TrackSelect updateQuery={updateQuery} {...props} />
      <ColumnSelect toggleColumnSelect={toggleColumnSelect} {...props} />
    </div>
  )
}

export default FilterOptions