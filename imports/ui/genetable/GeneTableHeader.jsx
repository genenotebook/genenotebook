import React from 'react';
import Select from 'react-select';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import ReactResizeDetector from 'react-resize-detector';

import { SelectAll } from './SelectionOptions.jsx';
import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './geneTableHeader.scss';

/**
 * [QUERY_TYPES description]
 * @type {Array}
 */
const QUERY_TYPES = ['None', 'Present', 'Not present', 'Equals', 
  'Does not equal', 'Contains', 'Does not contain'].map(query => {
  return {
    label: query, 
    value: query
  }
})

/**
 * [description]
 * @param  {[type]} options.queryKey   [description]
 * @param  {[type]} options.queryValue [description]
 * @return {[type]}                    [description]
 */
const labelFromQuery = ({ queryKey, queryValue }) => {
  let label;
  switch(queryKey){
    case '$exists':
      label = queryValue ? 'Present' : 'Not present';
      break
    case '$eq':
      label = 'Equals';
      break
    case '$ne':
      label = 'Does not equal';
      break
    default:
      console.error(`Unknown query: {${queryType}:${queryValue}}`)
      break
  }
  return label
}

/**
 * [description]
 * @param  {[type]} query [description]
 * @return {[type]}       [description]
 */
const stateFromQuery = query => {
  const queryKey = Object.keys(query)[0];
  const queryValue = Object.values(query)[0];
  let queryLabel;
  switch(queryKey){
    case '$exists':
      queryLabel = queryValue ? 'Present' : 'Not present';
      break
    case '$eq':
      queryLabel = 'Equals';//queryValue instanceof RegExp ? 'Contains' : 'Equals';
      break
    case '$ne':
      queryLabel = 'Does not equal';//queryValue instanceof RegExp ? 'Does not contain' : 'Does not equal';
      break
    case '$regex':
      queryLabel = 'Contains';
      break
    case '$not':
      queryLabel = 'Does not contain';
      break
    default:
      console.error(`Unknown query: {${queryType}:${queryValue}}`)
      break
  }
  const state = { queryLabel, queryValue };
  if (queryKey === '$not'){
    state.queryValue = queryValue['$regex'];
  }
  return state
}

/**
 * [description]
 * @param  {[type]} options.queryLabel [description]
 * @param  {[type]} options.queryValue [description]
 * @return {[type]}                    [description]
 */
const queryFromLabel = ({ queryLabel, queryValue }) => {
  let query;
  switch(queryLabel){
    case 'None':
      query = {};
      break
    case 'Present':
      query = { $exists: true };
      break
    case 'Not present':
      query = { $exists: false };
      break
    case 'Equals':
      query = { $eq: queryValue };
      break
    case 'Does not equal':
      query = { $ne: queryValue };
      break
    case 'Contains':
      query = { $regex: queryValue }
      break
    case 'Does not contain':
      query = { $not: { $regex: queryValue} }
      break
    default:
      console.error(`Unknown label/value: ${queryLabel}/${queryValue}`)
      break
  }
  return query
}

/**
 * 
 */
class HeaderElement extends React.Component {
  constructor(props){
    super(props)
    const { query, attribute, ...otherProps } = props;
    if (query.hasOwnProperty(attribute.query)){
      const attributeQuery = query[attribute.query];
      const queryKey = Object.keys(attributeQuery)[0];
      const queryValue = Object.values(attributeQuery)[0];
      this.state = stateFromQuery(attributeQuery);
    } else {
      this.state = {
        queryLabel: 'None',
        queryValue: ''
      }
    }
    this.state.sort = 'None'
  }

  updateQueryLabel = selection => {
    const { attribute, query, updateQuery, ...props } = this.props
    const queryLabel = selection ? selection.label : 'None';
    this.setState({
      queryLabel
    })
  }

  updateQueryValue = event => {
    const queryValue = event.target.value;
    this.setState({
      queryValue
    })
  }

  updateSort = event => {
    const sortOrder = event.target.id === this.state.sort ? 'None' : event.target.id;
    this.setState({
      sort: sortOrder
    })
  }

  hasNewQuery = () => {
    const { queryLabel, queryValue } = this.state;
    const newQuery = queryFromLabel({ queryLabel, queryValue });
    const { query, attribute, ...props } = this.props;

    if (query.hasOwnProperty(attribute.query)){
      return isEmpty(query) || !isEqual(query[attribute.query], newQuery)
    } else {
      return !isEmpty(newQuery)
    }
  }

  updateQuery = () => {
    const { query, attribute, updateQuery } = this.props;
    const { queryLabel, queryValue } = this.state;
    const newQuery = cloneDeep(query);

    if (queryLabel === 'None'){
      if (newQuery.hasOwnProperty(attribute.query)){
        delete newQuery[attribute.query]
      }
    } else {
      newQuery[attribute.query] = queryFromLabel({ queryLabel, queryValue });
    }

    updateQuery(newQuery)
  }

  render(){
    const { query, attribute, ...props} = this.props;
    const hasQuery = query.hasOwnProperty(attribute.query);
    const buttonClass = hasQuery ? 'btn-success' : 'btn-outline-dark';
    const orientation = attribute.name === 'Gene ID' ? 'left' : 'right';
    return (
      <th scope='col'>
        <div className='btn-group'>
          <button className={`btn btn-sm px-2 py-0 ${buttonClass}`} type="button" disabled>
            {attribute.name}
          </button>
          <Dropdown>
            <DropdownButton className={`btn btn-sm px-1 py-0 dropdown-toggle ${buttonClass}`}/>
            <DropdownMenu className={`dropdown-menu dropdown-menu-${orientation} px-2`}>
              <h6 className="dropdown-header">Sort:</h6>
              <div className="form-check">
                {
                  ['Increasing', 'Decreasing'].map(sortOrder => {
                    const checked = this.state.sort === sortOrder;
                    return (
                      <div key={sortOrder}>
                        <input className="form-check-input" 
                          type="checkbox" 
                          id={sortOrder} 
                          onClick={this.updateSort}
                          defaultChecked={checked} />
                        <label className="form-check-label" htmlFor={sortOrder}>
                          {sortOrder}
                        </label>
                      </div>
                    )
                  })
                }
              </div>
              <div className="dropdown-divider" />
              <h6 className="dropdown-header">Filter:</h6>
              <Select
                className='form-control-sm px-0 is-valid' 
                value={this.state.queryLabel}
                options={QUERY_TYPES}
                onChange={this.updateQueryLabel} />
              {
                ['None','Present','Not present'].indexOf(this.state.queryLabel) < 0 ?
                <textarea 
                  className="form-control" 
                  onChange={this.updateQueryValue} 
                  value={this.props.queryValue} /> :
                null
              }
              {
                this.hasNewQuery() ?
                <button type='button' className='btn btn-sm btn-block btn-outline-success' onClick={this.updateQuery}>
                  Update filter
                </button> :
                null
              }
            </DropdownMenu>
          </Dropdown>
        </div>
      </th>
    )
  }
}

const resize = width => {
  //console.log('Table header resize',width)
}

/**
 * [description]
 * @param  {[type]}    options.selectedColumns [description]
 * @param  {[type]}    options.attributes      [description]
 * @param  {...[type]} options.props           [description]
 * @return {[type]}                            [description]
 */
const GeneTableHeader = ({ selectedColumns, attributes, selectedGenes, selectedAllGenes, toggleSelectAllGenes, ...props }) => {
  const selectedAttributes = attributes.filter(attribute => {
    return selectedColumns.has(attribute.name)
  }).reduce((obj, attribute) => {
    obj[attribute.name] = attribute
    return obj
  },{})

  const activeSelection = [...selectedGenes].length > 0 || selectedAllGenes ? 'active' : '';
  return (
    <thead>
      <tr>
        {
          [...selectedColumns].map(attributeName => {
            const attribute = selectedAttributes[attributeName]
            return (
              <HeaderElement key={attribute.name} label={attribute.name} attribute={attribute} {...props} />
            )
          })
        }
        <th scope="col">
          <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>Gene model</button>
          <ReactResizeDetector handleWidth onResize={resize} />
        </th>
        <th scope="col">
          <div className="pull-right">
            <button type="button" className="btn btn-outline-dark btn-sm px-1 py-0" onClick={toggleSelectAllGenes}>
              <span className={`fa fa-check ${activeSelection}`} aria-hidden="true" />
            </button>
          </div>
        </th>
      </tr>
    </thead>
  )
}

export default GeneTableHeader;