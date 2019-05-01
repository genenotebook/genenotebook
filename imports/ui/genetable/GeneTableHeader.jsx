/* eslint-disable jsx-a11y/label-has-for */
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import logger from '/imports/api/util/logger.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './geneTableHeader.scss';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

class SelectionOption extends Object {
  constructor(optionName) {
    super();
    this.value = optionName;
    this.label = optionName;
  }
}

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
].map(query => new SelectionOption(query));

/**
 * [description]
 * @param  {[type]} options.queryLabel [description]
 * @param  {[type]} options.queryValue [description]
 * @return {[type]}                    [description]
 */
function queryFromLabel({ queryLabel: { label }, queryValue }) {
  let query;
  const queryArray = queryValue.split(/\n|↵/);
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
      query = { $in: queryArray };
      break;
    case 'Does not equal':
      query = { $nin: queryArray };
      break;
    case 'Contains':
      query = { $regex: queryArray.map(q => new RegExp(q)) };
      break;
    case 'Does not contain':
      query = { $not: { $regex: queryArray.map(q => new RegExp(q)) } };
      break;
    default:
      logger.warn(`Unknown label/value: ${label}/${queryValue}`);
      break;
  }
  return query;
}

function HeaderElement({
  attribute, query, updateQuery, sort, updateSort,
}) {
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryLabel, setQueryLabel] = useState(new SelectionOption('None'));
  const [queryValue, setQueryValue] = useState('');
  const attributeQuery = queryFromLabel({ queryLabel, queryValue });

  function hasNewQuery() {
    if (hasOwnProperty(query, attribute.query)) {
      return isEmpty(query) || !isEqual(query[attribute.query], attributeQuery);
    }
    return !isEmpty(attributeQuery);
  }

  function triggerQueryUpdate() {
    const newQuery = cloneDeep(query);
    if (queryLabel.label === 'None') {
      if (hasOwnProperty(newQuery, attribute.query)) {
        delete newQuery[attribute.query];
      }
    } else {
      newQuery[attribute.query] = attributeQuery;
    }
    setQueryLoading(true);
    updateQuery(newQuery, () => {
      setQueryLoading(false);
    });
  }

  function cancelQuery() {
    setQueryLabel(new SelectionOption('None'));
    setQueryValue('');
    const newQuery = cloneDeep(query);
    delete newQuery[attribute.query];
    setQueryLoading(true);
    updateQuery(newQuery, () => {
      setQueryLoading(false);
    });
  }

  function updateSortOrder(clickedSortOrder) {
    if (sort && hasOwnProperty(sort, attribute.query)) {
      updateSort(undefined);
    } else {
      updateSort({ [attribute.query]: clickedSortOrder });
    }
  }

  const hasQuery = !isEmpty(attributeQuery);
  const hasSort = typeof sort !== 'undefined' && hasOwnProperty(sort, attribute.query);

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
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          {queryLoading && <span className="icon-spin animate-spin" />}
          {attribute.name}
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
                          onChange={() => {
                            updateSortOrder(sortOrder);
                          }}
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
                  onChange={setQueryLabel}
                />
                {['None', 'Present', 'Not present'].indexOf(queryLabel.label) < 0 ? (
                  <textarea
                    className="form-control"
                    onChange={({ target }) => {
                      setQueryValue(target.value);
                    }}
                    value={queryValue}
                  />
                ) : null}
              </div>
              {hasNewQuery() && !queryLoading && (
                <button
                  type="button"
                  className="btn btn-sm btn-block btn-outline-success"
                  onClick={triggerQueryUpdate}
                >
                  Update filter
                </button>
              )}
              {queryLoading && (
                <button type="button" className="btn btn-sm btn-block btn-success" disabled>
                  <span className="icon-spin animate-spin" />
                  &nbsp;Query loading
                </button>
              )}
              {hasQuery && (
                <button
                  type="button"
                  className="btn btn-sm btn-block btn-outline-dark"
                  onClick={cancelQuery}
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
    .filter(attribute => selectedColumns.has(attribute.name))
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
