/* eslint-disable jsx-a11y/label-has-for */
import React from 'react';
import Select from 'react-select';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import logger from '/imports/api/util/logger.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './geneTableHeader.scss';

/**
 * [QUERY_TYPES description]
 * @type {Array}
 */
const QUERY_TYPES = [
  'None',
  'Present',
  'Not present',
  'Equals',
  'Does not equal',
  'Contains',
  'Does not contain',
].map(query => ({
  label: query,
  value: query,
}));

class SelectionOption extends Object {
  constructor(optionName) {
    super();
    this.value = optionName;
    this.label = optionName;
  }
}

/**
 * [description]
 * @param  {[type]} options.queryLabel [description]
 * @param  {[type]} options.queryValue [description]
 * @return {[type]}                    [description]
 */
function queryFromLabel({ queryLabel: { label, value }, queryValue }) {
  let query;
  switch (label) {
    case 'None':
      query = {};
      break;
    case 'Present':
      query = { $exists: true };
      break;
    case 'Not present':
      query = { $exists: false };
      break;
    case 'Equals':
      query = { $eq: queryValue };
      break;
    case 'Does not equal':
      query = { $ne: queryValue };
      break;
    case 'Contains':
      query = { $regex: queryValue };
      break;
    case 'Does not contain':
      query = { $not: { $regex: queryValue } };
      break;
    default:
      logger.warn(`Unknown label/value: ${label}/${queryValue}`);
      break;
  }
  return query;
}

function getAttributeQuery({ query, attribute }) {
  if (query.hasOwnProperty(attribute.query)) {
    return query[attribute.query];
  }

  const destructuredQuery = {};

  if (query.hasOwnProperty('$or')) {
    query.$or.map(q => Object.assign(destructuredQuery, q));
  }
  if (destructuredQuery.hasOwnProperty(attribute.query)) {
    return destructuredQuery[attribute.query];
  }
}

class HeaderElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortOrder: 'None',
      dummy: 0,
      queryLabel: new SelectionOption('None'),
      queryValue: '',
      queryLoading: false,
      attributeQuery: undefined,
    };
  }

  static getDerivedStateFromProps = (props, state) => {
    const { query, attribute } = props;
    const { attributeQuery } = state;
    const newAttributeQuery = getAttributeQuery({ query, attribute });

    if (!isEqual(newAttributeQuery, attributeQuery)) {
      return {
        attributeQuery: newAttributeQuery,
        queryLoading: false,
      };
    }
    return null;
  };

  updateQueryLabel = (selection) => {
    const { attribute, query, updateQuery } = this.props;
    const queryLabel = selection;

    this.setState({
      queryLabel,
      dummy: this.state.dummy + 1,
    });
  };

  updateQueryValue = (event) => {
    const queryValue = event.target.value;
    this.setState({
      queryValue,
    });
  };

  updateSortOrder = (event) => {
    const { attribute, updateSort } = this.props;
    const sortOrder = parseInt(event.target.id);
    const newSortOrder = sortOrder === this.state.sortOrder ? 'None' : sortOrder;
    const sort = newSortOrder === 'None' ? undefined : { [attribute.query]: newSortOrder };
    this.setState({ sortOrder: newSortOrder });
    updateSort(sort);
  };

  hasQuery = () => typeof this.state.attributeQuery !== 'undefined';

  hasSort = () => {
    const { sort, attribute } = this.props;
    return typeof sort !== 'undefined' && sort.hasOwnProperty(attribute.query);
  };

  hasNewQuery = () => {
    const { queryLabel, queryValue } = this.state;
    const newQuery = queryFromLabel({ queryLabel, queryValue });

    const { query, attribute, ...props } = this.props;

    if (query.hasOwnProperty(attribute.query)) {
      return isEmpty(query) || !isEqual(query[attribute.query], newQuery);
    }
    return !isEmpty(newQuery);
  };

  updateQuery = () => {
    const { query, attribute, updateQuery } = this.props;
    const { queryLabel, queryValue } = this.state;
    const newQuery = cloneDeep(query);

    if (queryLabel.label === 'None') {
      if (newQuery.hasOwnProperty(attribute.query)) {
        delete newQuery[attribute.query];
      }
    } else {
      newQuery[attribute.query] = queryFromLabel({ queryLabel, queryValue });
    }
    this.setState({
      queryLoading: true,
    });
    updateQuery(newQuery);
  };

  removeQuery = () => {
    const {
      query, attribute, updateQuery, history,
    } = this.props;
    const newQuery = cloneDeep(query);

    delete newQuery[attribute.query];
    delete newQuery.$or;

    this.setState(
      {
        queryLabel: new SelectionOption('None'),
        queryValue: '',
        dummy: this.state.dummy + 1,
      },
      (err, res) => {
        updateQuery(newQuery);
        history.push('/genes');
      },
    );
  };

  render() {
    const {
      query, attribute, sort, ...props
    } = this.props;
    const {
      queryLabel, queryValue, queryLoading, dummy,
    } = this.state;
    const hasQuery = this.hasQuery();
    const hasNewQuery = this.hasNewQuery();
    const hasSort = this.hasSort();

    const buttonClass = hasQuery || hasSort || queryLoading ? 'btn-success' : 'btn-outline-dark';
    const orientation = attribute.name === 'Gene ID' ? 'left' : 'right';
    const colStyle = attribute.name === 'Gene ID' ? { width: '10rem' } : {};

    return (
      <th scope="col" style={{ ...colStyle }}>
        <div className="btn-group btn-group-justified">
          <button
            className={`btn btn-sm px-2 py-0 genetable-dropdown ${buttonClass}`}
            type="button"
            disabled
          >
            {attribute.name}
            {queryLoading && <span className="icon-spin" />}
          </button>
          {attribute.name !== 'Genome' && (
            <Dropdown>
              <DropdownButton className={`btn btn-sm px-1 py-0 dropdown-toggle ${buttonClass}`} />
              <DropdownMenu className={`dropdown-menu dropdown-menu-${orientation} px-2`}>
                <div className={`sort-wrapper ${hasSort ? 'has-sort' : ''}`}>
                  <h6 className="dropdown-header">Sort:</h6>
                  <div className="form-check">
                    {[1, -1].map((sortOrder) => {
                      const checked = sort && sort[attribute.query] === sortOrder;
                      return (
                        <div key={`${sortOrder}-${checked}`}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={sortOrder}
                            onChange={this.updateSortOrder}
                            checked={checked}
                          />
                          <label className="form-check-label" htmlFor={sortOrder}>
                            {sortOrder === 1 ? 'Increasing' : 'Decreasing'}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="dropdown-divider" />
                <div className={`query-wrapper pb-1 mb-1 ${hasQuery ? 'has-query' : ''}`}>
                  <h6 className="dropdown-header">Filter:</h6>
                  <Select
                    className="form-control-sm pb-5"
                    value={queryLabel}
                    options={QUERY_TYPES}
                    onChange={this.updateQueryLabel}
                  />
                  {['None', 'Present', 'Not present'].indexOf(queryLabel.label) < 0 ? (
                    <textarea
                      className="form-control"
                      onChange={this.updateQueryValue}
                      value={queryValue}
                    />
                  ) : null}
                </div>
                {hasNewQuery && !queryLoading && (
                  <button
                    type="button"
                    className="btn btn-sm btn-block btn-outline-success"
                    onClick={this.updateQuery}
                  >
                    Update filter
                  </button>
                )}
                {queryLoading && (
                  <button type="button" className="btn btn-sm btn-block btn-success" disabled>
                    <span className="icon-spin" />
                    &nbsp;Query loading
                  </button>
                )}
                {hasQuery && (
                  <button
                    type="button"
                    className="btn btn-sm btn-block btn-outline-dark"
                    onClick={this.removeQuery}
                  >
                    <span className="icon-cancel" />
                    Cancel filter
                  </button>
                )}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </th>
    );
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
function GeneTableHeader({
  selectedColumns,
  attributes,
  selectedGenes,
  selectedAllGenes,
  toggleSelectAllGenes,
  selectedVisualization,
  ...props
}) {
  const selectedAttributes = attributes
    .filter(attribute => selectedColumns.indexOf(attribute.name) >= 0)
    .sort((a, b) => {
      if (a.name === 'Gene ID') return -1;
      if (b.name === 'Gene ID') return 1;
      return `${a.name}`.localeCompare(b.name);
    });

  const checkBoxColor = [...selectedGenes].length || selectedAllGenes ? 'black' : 'white';
  return (
    <thead>
      <tr>
        {selectedAttributes.map(attribute => (
          <HeaderElement
            key={attribute.name}
            label={attribute.name}
            attribute={attribute}
            {...props}
          />
        ))}
        <th scope="col">
          <button
            type="button"
            className="btn btn-sm btn-outline-dark px-2 py-0 btn-block genetable-dropdown"
            disabled
          >
            {selectedVisualization}
          </button>
        </th>
        <th scope="col" style={{ width: '10px' }}>
          <div className="pull-right">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-1 py-0"
              onClick={toggleSelectAllGenes}
            >
              <span className="icon-check" aria-hidden="true" style={{ color: checkBoxColor }} />
            </button>
          </div>
        </th>
      </tr>
    </thead>
  );
}

export default GeneTableHeader;
