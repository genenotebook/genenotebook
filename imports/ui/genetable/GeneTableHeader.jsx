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
function formatQuery({ queryLabel, queryValue }) {
  const queryArray = queryValue.split(/\n|↵|\|/);
  switch (queryLabel) {
    case 'None':
      return {};
    case 'Present':
      return { $exists: true };
    case 'Not present':
      return { $exists: false };
    case 'Equals':
      return { $in: queryArray };
    case 'Does not equal':
      return { $nin: queryArray };
    case 'Contains':
      return { $regex: new RegExp(queryArray.join('|')) };
    case 'Does not contain':
      return { $not: { $regex: new RegExp(queryArray.join('|')) } };
    case undefined:
      return undefined;
    default:
      logger.warn(`Unknown label/value: ${queryLabel}/${queryValue}`);
      return undefined;
  }
}

function formatLabelValue({ attribute, query }) {
  let queryLabel = 'None';
  let queryValue = '';
  let attributeQuery = {};
  if (query.$or && hasOwnProperty(query.$or[0], attribute.query)) {
    attributeQuery = query.$or[0][attribute.query];
  } else if (hasOwnProperty(query, attribute.query)) {
    attributeQuery = query[attribute.query];
  }

  if (hasOwnProperty(attributeQuery, '$exists')) {
    if (attributeQuery.$exists) {
      queryLabel = 'Present';
    } else {
      queryLabel = 'Not present';
    }
  } else if (hasOwnProperty(attributeQuery, '$in')) {
    queryLabel = 'Equals';
    queryValue = attributeQuery.$in;
  } else if (hasOwnProperty(attributeQuery, '$nin')) {
    queryLabel = 'Does not equal';
    queryValue = attributeQuery.$nin;
  } else if (hasOwnProperty(attributeQuery, '$regex')) {
    queryLabel = 'Contains';
    queryValue = attributeQuery.$regex;
  } else if (hasOwnProperty(attributeQuery, '$not')) {
    queryLabel = 'Does not contain';
    queryValue = attributeQuery.$not.$regex;
  }

  if (Array.isArray(queryValue)) {
    queryValue = queryValue.join('\n');
  }

  return [queryLabel, queryValue];
}

function HeaderElement({
  attribute, query, updateQuery, cancelQuery, sort, updateSort,
}) {
  let [currentQueryLabel, currentQueryValue] = formatLabelValue({ attribute, query });
  const [attributeQuery, setAttributeQuery] = useState({
    queryLabel: currentQueryLabel,
    queryValue: currentQueryValue,
  });
  const { queryLabel, queryValue } = attributeQuery;
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    [currentQueryLabel, currentQueryValue] = formatLabelValue({ attribute, query });
    setAttributeQuery({
      queryLabel: currentQueryLabel,
      queryValue: currentQueryValue,
    });
  }, [query]);

  function triggerQueryUpdate() {
    const newQuery = cloneDeep(query);
    if (queryLabel.label === 'None') {
      if (hasOwnProperty(newQuery, attribute.query)) {
        delete newQuery[attribute.query];
      }
    } else {
      newQuery[attribute.query] = formatQuery({ ...attributeQuery }); // attributeQuery;
    }
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

  const hasQuery = currentQueryLabel !== 'None';
  const hasNewQuery = currentQueryLabel !== queryLabel || currentQueryValue !== queryValue;
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
                  value={new SelectionOption(queryLabel)}
                  options={QUERY_TYPES}
                  onChange={({ label }) => {
                    setAttributeQuery({
                      queryLabel: label,
                      queryValue,
                    });
                  }}
                />
                {['None', 'Present', 'Not present'].indexOf(queryLabel) < 0 ? (
                  <textarea
                    className="form-control"
                    onChange={({ target }) => {
                      setAttributeQuery({
                        queryLabel,
                        queryValue: target.value,
                      });
                    }}
                    value={queryValue}
                  />
                ) : null}
              </div>
              {hasNewQuery && !queryLoading && (
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
