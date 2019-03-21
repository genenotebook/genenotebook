import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
// import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { queryCount } from '/imports/api/methods/queryCount.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import FilterOptions from './filteroptions/FilterOptions.jsx';
import { SelectionOptions } from './SelectionOptions.jsx';

import GeneTableHeader from './GeneTableHeader.jsx';
import GeneTableBody from './GeneTableBody.jsx';
import DownloadDialogModal from './downloads/DownloadDialog.jsx';

import './geneTable.scss';

export const VISUALIZATIONS = [
  'Gene model',
  'Protein domains',
  'Gene expression',
];

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const attributeTracker = ({ location, history }) => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes,
    location,
    history,
  };
};

/**
 * [description]
 * @param  {[type]} options.attributes [description]
 * @return {[type]}                    [description]
 */
const searchTracker = ({ attributes, location, history }) => {
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
      ({ defaultShow, defaultSearch, name }) => defaultShow || defaultSearch || new RegExp(name).test(searchAttributes),
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
  };
};

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
    const hits =      blastJob.result.BlastOutput.BlastOutput_iterations[0].Iteration[0]
        .Iteration_hits[0].Hit;
    const geneIds = hits.map((hit) => {
      const geneId = hit.Hit_def[0].split(' ')[0];
      return geneId;
    });

    searchQuery.ID = { $in: geneIds }; // eslint-disable-line no-param-reassign
    return <Component searchQuery={searchQuery} {...props} />;
  };
}

/**
 * Dynamic table for displaying gene information with columns that can be queried and configured
 * @param { array } [attributes] array of gene attributes that will be shown as columns
 * @kind {class}
 */
class GeneTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      limit: 20,
      query: {},
      sort: undefined,
      currentQueryCount: '...',
      selectedGenes: new Set(),
      selectedAllGenes: false,
      selectedColumns: [],
      selectedVisualization: VISUALIZATIONS[0],
      showDownloadDialog: false,
      search: '',
      dummy: 0,
    };
  }

  static getDerivedStateFromProps = (props, state) => {
    const { query: oldQuery } = state;
    const { searchQuery, selectedAttributes } = props;

    /*
    Determine what columns to show
     */
    // eslint-disable-next-line no-underscore-dangle
    const _selectedColumns = new Set([
      'Gene ID',
      ...state.selectedColumns,
      ...selectedAttributes,
    ]);
    const selectedColumns = [..._selectedColumns];

    /*
    Figure out what the query should be
     */
    const query = {};

    if (!isEmpty(searchQuery)) {
      Object.assign(query, oldQuery, searchQuery);
      return {
        query,
        selectedColumns,
      };
    }

    return {
      selectedColumns,
    };
  };

  componentDidUpdate = (prevProps) => {
    const currProps = this.props;
    // const { query } = this.state;
    if (!isEqual(currProps.searchQuery, prevProps.searchQuery)) {
      this.getQueryCount();
    }
  };

  componentDidMount = () => {
    this.getQueryCount();
  };

  getQueryCount = () => {
    const { query } = this.state;
    queryCount.call({ query }, (err, res) => {
      const currentQueryCount = new Intl.NumberFormat().format(res);
      this.setState({ currentQueryCount });
    });
  };

  updateScrollLimit = (limit) => {
    this.setState({ limit });
  };

  updateQuery = (query) => {
    // const { selectedAttributes, history, searchAttributes, searchValue } = this.props;

    queryCount.call({ query }, (err, res) => {
      const currentQueryCount = new Intl.NumberFormat().format(res);
      this.setState({
        query,
        currentQueryCount,
        dummy: this.state.dummy + 1,
      });
    });
  };

  updateSort = (sort) => {
    this.setState({
      sort,
      dummy: this.state.dummy + 1, // weird hack to force updating if sort object changes.
    });
  };

  updateSelection = (event) => {
    const geneId = event.target.id;
    this.setState(({ selectedGenes }) => {
      if (!selectedGenes.has(geneId)) {
        selectedGenes.add(geneId);
      } else {
        selectedGenes.delete(geneId);
      }
      return {
        selectedGenes: cloneDeep(selectedGenes),
      };
    });
  };

  toggleDownloadDialog = () => {
    this.setState({
      showDownloadDialog: !this.state.showDownloadDialog,
    });
  };

  toggleSelectAllGenes = () => {
    // Set selectedAllGenes to false if a selection is made,
    // otherwise toggle current selectAllGenes state
    const selectedAllGenes =      this.state.selectedGenes.size > 0 ? false : !this.state.selectedAllGenes;
    this.setState({
      selectedGenes: new Set(),
      selectedAllGenes,
    });
  };

  toggleColumnSelect = (event) => {
    const { id } = event.target;
    this.setState((oldState) => {
      const selectedColumns = new Set(oldState.selectedColumns);
      if (selectedColumns.has(id)) {
        selectedColumns.delete(id);
      } else {
        selectedColumns.add(id);
      }
      selectedColumns.add('Gene ID');
      return {
        selectedColumns: [...selectedColumns],
      };
    });
  };

  toggleVisualization = (event) => {
    const selectedVisualization = event.target.id;
    this.setState({ selectedVisualization });
  };

  render() {
    const { attributes, history } = this.props;
    const {
      limit,
      query,
      sort,
      currentQueryCount,
      selectedGenes,
      selectedAllGenes,
      selectedColumns,
      selectedVisualization,
      showDownloadDialog,
    } = this.state;

    const headerOptions = {
      selectedColumns,
      selectedGenes,
      selectedAllGenes,
      toggleSelectAllGenes: this.toggleSelectAllGenes,
      selectedVisualization,
      updateQuery: this.updateQuery,
      query,
      updateSort: this.updateSort,
      sort,
      attributes,
      history,
    };

    const bodyOptions = {
      query,
      sort,
      limit,
      selectedGenes,
      selectedAllGenes,
      updateSelection: this.updateSelection,
      selectedColumns,
      attributes,
      selectedVisualization,
      updateScrollLimit: this.updateScrollLimit,
    };

    const downloadOptions = {
      selectedGenes,
      showDownloadDialog,
      selectedAllGenes,
      query,
      toggleDownloadDialog: this.toggleDownloadDialog,
    };

    return (
      <div className="container-fluid px-0 mx-0 genetable">
        <div className="table-responsive h-80">
          <div className="card genetable-wrapper h-100 my-2">
            <div className="card-header d-flex justify-content-between px-1 py-1">
              <FilterOptions
                toggleColumnSelect={this.toggleColumnSelect}
                toggleVisualization={this.toggleVisualization}
                updateQuery={this.updateQuery}
                {...this.props}
                {...this.state}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-dark px-2 mx-2 py-0 border query-count"
                disabled
              >
                <span className="badge badge-dark">{currentQueryCount}</span>
                &nbsp;query results
              </button>
              <SelectionOptions
                toggleSelectAllGenes={this.toggleSelectAllGenes}
                toggleDownloadDialog={this.toggleDownloadDialog}
                {...this.props}
                {...this.state}
              />
            </div>
            <table className="genetable table table-hover table-sm">
              <GeneTableHeader {...headerOptions} />
              <GeneTableBody {...bodyOptions} />
            </table>
          </div>
        </div>
        <DownloadDialogModal {...downloadOptions} />
      </div>
    );
  }
}

const withConditionalRendering = compose(
  withTracker(attributeTracker),
  withEither(isLoading, Loading),
  withTracker(searchTracker),
  withTracker(blastJobTracker),
  withEither(isLoading, Loading),
  withEither(hasNoBlastJob, GeneTable),
  processBlastJob,
);

export default withConditionalRendering(GeneTable);
