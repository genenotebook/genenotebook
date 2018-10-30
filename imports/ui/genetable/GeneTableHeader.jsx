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
  return { label: label, value: label }
}

/**
 * [description]
 * @param  {[type]} query [description]
 * @return {[type]}       [description]
 */
const stateFromQuery = attributeQuery => {
  const [queryKey, queryValue] = Object.entries(attributeQuery)[0];

  let queryLabel;
  switch(queryKey){
    case '$exists':
      queryLabel = queryValue ? 'Present' : 'Not present';
      break
    case '$eq':
      queryLabel = 'Equals';
      break
    case '$ne':
      queryLabel = 'Does not equal';
      break
    case '$regex':
      queryLabel = 'Contains';
      break
    case '$not':
      queryLabel = 'Does not contain';
      break
    default:
      console.error(`Unknown query: {${queryKey}:${queryValue}}`)
      break
  }
  const state = { 
    queryLabel : { 
      label: queryLabel, 
      value: queryLabel 
    }, 
    queryValue,
    attributeQuery 
  };

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
const queryFromLabel = ({ queryLabel: { label, value }, queryValue }) => {
  let query;
  switch(label){
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
      console.error(`Unknown label/value: ${label}/${queryValue}`)
      break
  }
  return query
}

const getAttributeQuery = ({ query, attribute }) => {
  if (query.hasOwnProperty(attribute.query)){
    return query[attribute.query]
  } else {
    if (query.hasOwnProperty('$or')){
      return query.$or.filter(searchQuery => {
        return Object.keys(searchQuery)[0] === attribute.query
      })[0]
    }
  }
}

/**
 * 
 */
class HeaderElement extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      sortOrder: 'None',
      dummy: 0,
      queryLabel: { label: 'None', value: 'None' },
      queryValue: ''
    };
  }

  static getDerivedStateFromProps = (props, state) => {
    const { query, attribute, ...otherProps } = props;
    const attributeQuery = getAttributeQuery({ query, attribute });
    if (typeof attributeQuery !== 'undefined'){
      const newState = stateFromQuery(attributeQuery);
      return newState
    }
    return null 
  }

  updateQueryLabel = selection => {
    const { attribute, query, updateQuery, ...props } = this.props
    const queryLabel = selection;

    this.setState({
      queryLabel,
      dummy: this.state.dummy + 1
    })
  }

  updateQueryValue = event => {
    const queryValue = event.target.value;
    this.setState({
      queryValue
    })
  }

  updateSortOrder = event => {
    const { attribute, updateSort } = this.props;
    const sortOrder = parseInt(event.target.id)
    const newSortOrder = sortOrder === this.state.sortOrder ? 'None' : sortOrder;
    const sort = newSortOrder === 'None' ? undefined : { [attribute.query]: newSortOrder };
    this.setState({ sortOrder: newSortOrder });
    updateSort(sort)
  }

  hasQuery = () => {
    //console.log('check hasQuery', this.state.attributeQuery)
    return typeof this.state.attributeQuery !== 'undefined'
  }

  hasSort = () => {
    const { sort, attribute } = this.props;
    return typeof sort !== 'undefined' && sort.hasOwnProperty(attribute.query)
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

    if (queryLabel.label === 'None'){
      if (newQuery.hasOwnProperty(attribute.query)){
        delete newQuery[attribute.query]
      }
    } else {
      newQuery[attribute.query] = queryFromLabel({ queryLabel, queryValue });
    }

    updateQuery(newQuery)
  }

  removeQuery = () => {
    const { query, attribute, updateQuery } = this.props;
    const newQuery = cloneDeep(query);
    delete newQuery[attribute.query];
    this.setState({
      queryLabel: { label: 'None', value: 'None' },
      queryValue: '',
      attributeQuery: undefined
    }, (err, res) => {
      updateQuery(newQuery);
    })
  }

  render(){
    const { query, attribute, sort,  ...props} = this.props;
    const { queryLabel, queryValue } = this.state;
    const hasQuery = this.hasQuery();
    const hasNewQuery = this.hasNewQuery();
    const hasSort = this.hasSort();

    const buttonClass = hasQuery || hasSort ? 'btn-success' : 'btn-outline-dark';
    const orientation = attribute.name === 'Gene ID' ? 'left' : 'right';
    const colStyle = attribute.name === 'Gene ID' ? { width: '10rem' } : {};
    
    return <th scope='col' style={{...colStyle}}>
      <div className='btn-group btn-group-justified'>
        <button className={`btn btn-sm px-2 py-0 genetable-dropdown ${buttonClass}`} 
          type="button" disabled>
          {attribute.name}
        </button>
        <Dropdown>
          <DropdownButton className={`btn btn-sm px-1 py-0 dropdown-toggle ${buttonClass}`}/>
          <DropdownMenu className={`dropdown-menu dropdown-menu-${orientation} px-2`}>
            <div className={`sort-wrapper ${hasSort ? 'has-sort' : ''}`}>
              <h6 className="dropdown-header">Sort:</h6>
              <div className="form-check">
                {
                  [1, -1].map(sortOrder => {
                    const checked = sort && sort[attribute.query] === sortOrder;
                    return (
                      <div key={`${sortOrder}-${checked}`}>
                        <input className="form-check-input" 
                          type="checkbox" 
                          id={sortOrder} 
                          onChange={this.updateSortOrder}
                          checked={checked} />
                        <label className="form-check-label" htmlFor={sortOrder}>
                          { sortOrder === 1 ? 'Increasing' : 'Decreasing' }
                        </label>
                      </div>
                    )
                  })
                }
              </div>
            </div>
            <div className="dropdown-divider" />
            <div className={`query-wrapper pb-1 mb-1 ${hasQuery ? 'has-query' : ''}`}>
              <h6 className="dropdown-header">Filter:</h6>
              <Select className='form-control-sm pb-5' value={queryLabel}
                options={QUERY_TYPES} onChange={this.updateQueryLabel} />
              {
                ['None','Present','Not present'].indexOf(queryLabel.label) < 0 ?
                <textarea className="form-control" onChange={this.updateQueryValue} 
                  value={queryValue} /> :
                null
              }
            </div>
            {
              hasNewQuery &&
              <button type='button' className='btn btn-sm btn-block btn-outline-success' 
                onClick={this.updateQuery}>
                Update filter
              </button>
            }
            {
              hasQuery &&
              <button type='button' className='btn btn-sm btn-block btn-outline-dark' 
                onClick={this.removeQuery}>
                <span className='icon-cancel' />Cancel filter
              </button>
            }
          </DropdownMenu>
        </Dropdown>
      </div>
    </th>
  }
}

/**
 * [description]
 * @param  {[type]}    options.selectedColumns       [description]
 * @param  {[type]}    options.attributes            [description]
 * @param  {[type]}    options.selectedGenes         [description]
 * @param  {[type]}    options.selectedAllGenes      [description]
 * @param  {[type]}    options.toggleSelectAllGenes  [description]
 * @param  {[type]}    options.selectedVisualization [description]
 * @param  {...[type]} options.props                 [description]
 * @return {[type]}                                  [description]
 */
const GeneTableHeader = ({ selectedColumns, attributes, selectedGenes, 
  selectedAllGenes, toggleSelectAllGenes, selectedVisualization, ...props }) => {

  const selectedAttributes = attributes.filter(attribute => {
    return selectedColumns.indexOf(attribute.name) >= 0
  }).sort((a,b) => {
    if (a.name === 'Gene ID') return -1;
    if (b.name === 'Gene ID') return 1;
    return ('' + a.name).localeCompare(b.name);
  })

  const checkBoxColor = [...selectedGenes].length || selectedAllGenes ? 'black' : 'white';
  return (
    <thead>
      <tr>
        {
          selectedAttributes.map(attribute => {
            return <HeaderElement key={attribute.name} label={attribute.name} 
                attribute={attribute} {...props} />
          })
        }
        <th scope="col">
          <button className='btn btn-sm btn-outline-dark px-2 py-0 btn-block genetable-dropdown' disabled>
            { selectedVisualization }
          </button>
        </th>
        <th scope="col" style={{width: '10px'}}>
          <div className="pull-right">
            <button type="button" className="btn btn-outline-dark btn-sm px-1 py-0" 
              onClick={toggleSelectAllGenes}>
              <span className='icon-check' aria-hidden="true" style={{color: checkBoxColor}} />
            </button>
          </div>
        </th>
      </tr>
    </thead>
  )
}

export default GeneTableHeader;