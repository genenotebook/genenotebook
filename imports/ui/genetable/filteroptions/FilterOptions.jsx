import React from 'react';

import GenomeSelect from './GenomeSelect.jsx';
import ColumnSelect from './ColumnSelect.jsx';

import './filteroptions.scss';

const FilterOptions = ({ ...props }) => {
  return (
    <div className='btn-group' role='group'>
      <button className='btn btn-sm btn-outline-dark px-2 py-0 border' disabled>
        Select:
      </button>
      <GenomeSelect {...props} />
      <ColumnSelect {...props} />
    </div>
  )
}

export default FilterOptions