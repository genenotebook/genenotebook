import React from 'react';

import Select from 'react-select';

const SELECT_OPTIONS = [
  {label: 'Equals', value: 'equals'},
  {label: 'Does not equal', value: 'notEquals'},
  {label: 'Contains', value: 'contains'},
  {label: 'Does not contain', value: 'notContains'}
]

const HeaderElementDropDown = ({...props}) => {
  return (
    <div className="dropdown-menu px-2">
      <h6 className="dropdown-header">Select query</h6>
      <div className="btn-group" role="group">
        <button type="button" className="btn btn-sm btn-outline-success">Present</button>
        <button type="button" className="btn btn-sm btn-outline-danger">Not present</button>
        <button type="button" className="btn btn-sm btn-outline-dark">Either</button>
      </div>
      <div className="dropdown-divider" />
      <Select 
      value='equals'
      options={SELECT_OPTIONS} />
      <textarea className="form-control" />
      <div className="dropdown-divider" />
      <button type="button" className="btn btn-sm btn-outline-dark pull-right">
        <span className="fa fa-times-circle" /> Remove column
      </button>
    </div>
  )
}

const HeaderElement = ({label, ...props}) => {
  return (
    <th scope="col">
      <div className='btn-group'>
        <button className="btn btn-outline-dark btn-sm" type="button" disabled>
          <strong>{label}</strong>
        </button>
        <button className="btn btn-sm btn-outline-dark dropdown-toggle" type="button" data-toggle="dropdown" />
        {/*<div className="dropdown-menu" >
          <a className="dropdown-item" href="#">Gene ID select</a>
        </div>*/}
        
        <HeaderElementDropDown />
        
      </div>
    </th>
  )
}

const GeneTableHeader = ({ selectedColumns, ...props }) => {
  return (
    <thead>
      <tr>
        <HeaderElement label='Gene ID' />
        {/*<th scope="col">Gene ID <span className="fa fa-sort" /></th>*/}
        {
          Array.from(selectedColumns).map(column => {
            return (
              <HeaderElement key={column} label={column} />
            )
          })
        }
        {/*
        <th scope="col">Name</th>
        <th scope="col">Product</th>
        <th scope="col">Expression</th>
        */}
        <th scope="col"><div className="pull-right">Select</div></th>
      </tr>
    </thead>
  )
}

export default GeneTableHeader;