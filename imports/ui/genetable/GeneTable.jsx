import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState, useEffect } from 'react';
import { compose } from 'recompose';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import getQueryCount from '/imports/api/methods/getQueryCount.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import FilterOptions from './filteroptions/FilterOptions.jsx';
import SelectionOptions from './SelectionOptions.jsx';

import GeneTableHeader from './GeneTableHeader.jsx';
import GeneTableBody from './GeneTableBody.jsx';
import DownloadDialogModal from './downloads/DownloadDialog.jsx';

import './geneTable.scss';

export const VISUALIZATIONS = ['Gene model', 'Protein domains', 'Gene expression'];

/**
 * Reactive data tracker to identify available gene attributes
 * @param  {Object} props [description]
 * @return {Object}       [description]
 */
function attributeTracker({ location, history, ...props }) {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes,
    location,
    history,
    ...props,
  };
}

/**
 * [description]
 * @param  {[type]} options.attributes [description]
 * @return {[type]}                    [description]
 */
function searchTracker({
  attributes, location, history, ...props
}) {
  const { search } = location;
  const queryString = new URLSearchParams(search);

  const attributeString = queryString.get('attributes') || '';
  const searchAttributes = attributeString.split(',');

  const searchValue = queryString.get('search') || '';

  const searchQuery = { $or: [] };
  attributes
    .filter(({ name }) => new RegExp(name).test(searchAttributes))
    .forEach((attribute) => {
      searchQuery.$or.push({
        [attribute.query]: {
          $regex: searchValue,
          $options: 'i',
        },
      });
    });

  const selectedAttributes = attributes
    .filter(
      ({ defaultShow, defaultSearch, name }) => defaultShow
        || defaultSearch
        || new RegExp(name).test(searchAttributes),
    )
    .map(({ name }) => name);

  if (!searchQuery.$or.length) {
    delete searchQuery.$or;
  }

  return {
    attributes,
    selectedAttributes,
    searchAttributes,
    searchValue,
    searchQuery,
    location,
    history,
    ...props,
  };
}

function blastJobTracker({ location, ...props }) {
  const { search } = location;
  const queryString = new URLSearchParams(search);
  const jobId = queryString.get('blastJob');
  if (!jobId) return { ...props };

  const subscription = Meteor.subscribe('jobQueue');
  const loading = subscription.ready();
  const blastJob = jobQueue.findOne({ _id: jobId });

  return {
    loading,
    location,
    blastJob,
    ...props,
  };
}

function hasNoBlastJob({ blastJob }) {
  return typeof blastJob === 'undefined';
}

function processBlastJob(Component) {
  return function({ searchQuery, blastJob, ...props }) {
    const hits = blastJob
      .result
      .BlastOutput
      .BlastOutput_iterations[0]
      .Iteration[0]
      .Iteration_hits[0]
      .Hit;
    const geneIds = hits.map((hit) => {
      const geneId = hit.Hit_def[0].split(' ')[0];
      return geneId;
    });

    searchQuery.ID = { $in: geneIds }; // eslint-disable-line no-param-reassign
    return <Component searchQuery={searchQuery} {...props} />;
  };
}

function GeneTable({
  searchQuery, selectedAttributes, attributes, history, genomeDataCache,
}) {
  const [limit, setLimit] = useState(20);
  const [query, setQuery] = useState(searchQuery);
  useEffect(() => {
    if (!isEqual(query, searchQuery)) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  const [sort, setSort] = useState(undefined);
  const [queryCount, setQueryCount] = useState('...');
  const [selectedGenes, setSelectedGenes] = useState(new Set());
  const [allGenes, setAllGenes] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    new Set(['Gene ID', ...selectedAttributes]),
  );
  const [selectedViz, setSelectedViz] = useState(VISUALIZATIONS[0]);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  function toggleColumnSelect(event) {
    const { id } = event.target;
    const newSelection = cloneDeep(selectedColumns);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedColumns(newSelection);
  }

  function toggleVisualization(event) {
    const { id } = event.target;
    setSelectedViz(id);
  }

  function toggleDownloadDialog() {
    setShowDownloadDialog(!showDownloadDialog);
  }

  function toggleSelectAllGenes() {
    // Set selectedAllGenes to false if a selection is made,
    // otherwise toggle current selectAllGenes state
    const selectedAllGenes = selectedGenes.size > 0 ? false : !allGenes;
    setAllGenes(selectedAllGenes);
    setSelectedGenes(new Set());
  }

  function updateGeneSelection(event) {
    const { id } = event.target;
    const newSelection = cloneDeep(selectedGenes);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedGenes(newSelection);
  }

  function updateSort(_sort) {
    const newSort = cloneDeep(_sort);
    setSort(newSort);
  }

  function updateQuery(newQuery, updateFinishedCallback) {
    setQueryCount('...');
    getQueryCount.call({ query: newQuery }, (err, res) => {
      const currentQueryCount = new Intl.NumberFormat().format(res);
      setQuery(newQuery);
      setQueryCount(currentQueryCount);
      if (updateFinishedCallback && typeof updateFinishedCallback === 'function') {
        updateFinishedCallback();
      }
    });
  }

  function cancelQuery() {
    history.push('/genes');
  }

  getQueryCount.call({ query }, (err, res) => {
    const currentQueryCount = new Intl.NumberFormat().format(res);
    setQueryCount(currentQueryCount);
  });

  return (
    <div className="container genetable">
      <div className="card genetable-wrapper table-container">
        <div className="card-header">
          <div className="columns is-vcentered">
            <div className="column">
              <FilterOptions
                {...{
                  attributes,
                  selectedColumns,
                  toggleColumnSelect,
                  selectedVisualization: selectedViz,
                  toggleVisualization,
                  query,
                  updateQuery,
                }}
              />
            </div>
            <div className="column">
              <div className="tags has-addons is-centered">
                <span className="tag">
                  &#8470; query results
                </span>
                <span className="tag is-small is-info">
                  {queryCount}
                </span>
              </div>
            </div>
            <div className="column">
              <div className="is-pulled-right">
                <SelectionOptions
                  {...{
                    selectedGenes,
                    selectedAllGenes: allGenes,
                    toggleDownloadDialog,
                    toggleSelectAllGenes,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <table className="genetable table is-narrow is-hoverable is-fullwidth">
          <GeneTableHeader
            {...{
              selectedColumns,
              selectedGenes,
              selectedAllGenes: allGenes,
              toggleSelectAllGenes,
              selectedVisualization: selectedViz,
              updateQuery,
              cancelQuery,
              query,
              updateSort,
              sort,
              attributes,
              history,
            }}
          />
          <GeneTableBody
            {...{
              query,
              sort,
              limit,
              selectedGenes,
              selectedAllGenes: allGenes,
              updateSelection: updateGeneSelection,
              selectedColumns,
              attributes,
              selectedVisualization: selectedViz,
              updateScrollLimit: setLimit,
              genomeDataCache,
            }}
          />
        </table>
      </div>
      {showDownloadDialog && (
        <DownloadDialogModal
          {...{
            selectedGenes,
            showDownloadDialog,
            selectedAllGenes: allGenes,
            query,
            toggleDownloadDialog,
          }}
        />
      )}
    </div>
  );
}

export default compose(
  withTracker(attributeTracker),
  withEither(isLoading, Loading),
  withTracker(searchTracker),
  withTracker(blastJobTracker),
  withEither(isLoading, Loading),
  withEither(hasNoBlastJob, GeneTable),
  processBlastJob,
)(GeneTable);
