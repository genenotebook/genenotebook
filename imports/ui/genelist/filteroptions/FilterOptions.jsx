import React from 'react';

import ReferenceSelect from './ReferenceSelect.jsx';
import TrackSelect from './TrackSelect.jsx';
import ColumnSelect from './ColumnSelect.jsx';

const FilterOptions = ({...props}) => {
  return (
    <div className='btn-group' role='group'>
      <button className='btn btn-sm btn-outline-dark' disabled>
        Select:
      </button>
      <ReferenceSelect {...props} />
      <TrackSelect {...props} />
      <ColumnSelect {...props} />
    </div>
  )
}

export default FilterOptions