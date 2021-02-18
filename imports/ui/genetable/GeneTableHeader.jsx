/* eslint-disable jsx-a11y/label-has-for */
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import logger from '/imports/api/util/logger.js';

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
].map((query) => new SelectionOption(query));

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
  const hasNewQuery = currentQueryLabel !== queryLabel
    || currentQueryValue !== queryValue;
  const hasSort = typeof sort !== 'undefined'
    && hasOwnProperty(sort, attribute.query);

  const buttonClass = hasQuery || hasSort || queryLoading
    ? 'is-success is-light is-outlined'
    : '';
  const orientation = attribute.name === 'Gene ID' ? 'left' : 'right';
  const colStyle = attribute.name === 'Gene ID' ? { width: '10rem' } : {};

  return (
    <th scope="col" style={{ ...colStyle }}>
      <div className="field has-addons header-element" role="group">
        <div className="control header-element">
          <button
            className={`button is-small is-fullwidth genetable-dropdown is-static ${buttonClass}`}
            type="button"
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            {/* queryLoading && <span className="icon-spin animate-spin" /> */}
            {attribute.name}
          </button>
        </div>
        <div className="control">
          {attribute.name !== 'Genome' && (
            <div className="dropdown is-hoverable columnselect">
              <div className="dropdown-trigger">
                <button type="button" className={`button is-small ${buttonClass} ${queryLoading ? 'is-loading' : ''}`}>
                  <span className="icon">
                    <span className="icon-down" />
                  </span>
                </button>
              </div>
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-content">
                  <div className={`dropdown-item sort-wrapper ${hasSort ? 'has-sort' : ''}`}>
                    <h6 className="is-h6 dropdown-item dropdown-header">
                      Sort:
                    </h6>
                    {[1, -1].map((sortOrder) => {
                      const checked = sort && sort[attribute.query] === sortOrder;
                      return (
                        <div key={`${sortOrder}-${checked}`}>
                          <label className="checkbox" htmlFor={sortOrder}>
                            <input
                              className="dropdown-checkbox is-small"
                              type="checkbox"
                              id={sortOrder}
                              onChange={() => {
                                updateSortOrder(sortOrder);
                              }}
                              checked={checked}
                            />
                            {sortOrder === 1 ? 'Increasing' : 'Decreasing'}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <hr className="dropdown-divider" />
                  <div className={`dropdown-item query-wrapper ${hasQuery ? 'has-query' : ''}`}>
                    <h6 className="is-h6 dropdown-item dropdown-header">
                      Filter:
                    </h6>
                    <Select
                      className="control"
                      // closeMenuOnSelect={false}
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
                        className="textarea"
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
                    className={`button is-small is-fullwidth is-success is-light ${queryLoading && 'is-loading'}`}
                    onClick={triggerQueryUpdate}
                  >
                    Update filter
                  </button>
                  )}
                  {hasQuery && (
                  <button
                    type="button"
                    className="button is-small is-fullwidth"
                    onClick={cancelQuery}
                  >
                    <span className="icon-cancel" />
                    Cancel filter
                  </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
    .filter((attribute) => selectedColumns.has(attribute.name))
    .sort((a, b) => {
      if (a.name === 'Gene ID') return -1;
      if (b.name === 'Gene ID') return 1;
      return `${a.name}`.localeCompare(b.name);
    });

  const checkBoxColor = [...selectedGenes].length || selectedAllGenes ? 'black' : 'white';
  return (
    <thead>
      <tr>
        {selectedAttributes.map((attribute) => (
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
            className="button is-small is-static is-fullwidth"
          >
            {selectedVisualization}
          </button>
        </th>
        <th scope="col" style={{ width: '10px' }}>
          <div className="pull-right">
            <button
              type="button"
              className="button is-small"
              title="Select all"
              onClick={toggleSelectAllGenes}
            >
              <span className="icon">
                <span className="icon-check" aria-hidden="true" style={{ color: checkBoxColor }} />
              </span>
            </button>
          </div>
        </th>
      </tr>
    </thead>
  );
}

export default GeneTableHeader;
