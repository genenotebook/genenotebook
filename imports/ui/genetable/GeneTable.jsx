import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import { cloneDeep, isEqual, isEmpty } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import { queryCount } from '/imports/api/methods/queryCount.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import FilterOptions from './filteroptions/FilterOptions.jsx';
import { SelectionOptions } from './SelectionOptions.jsx';

import GeneTableHeader from './GeneTableHeader.jsx';
import GeneTableBody from './GeneTableBody.jsx';
import DownloadDialogModal from './downloads/DownloadDialog.jsx';

import './geneTable.scss';

export const VISUALIZATIONS =['Gene model', 'Protein domains', 'Gene expression'];

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const attributeTracker = ({ searchAttributes, searchValue }) => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading, 
    attributes,
    searchAttributes,
    searchValue
  }
}

/**
 * [description]
 * @param  {[type]} options.attributes [description]
 * @return {[type]}                    [description]
 */
const searchTracker = ({ attributes, searchAttributes, searchValue }) => {
  const query = { $or: [] };
  attributes
    .filter(({ name }) => new RegExp(name).test(searchAttributes) )
    .forEach(attribute => {
      query.$or.push({ 
        [attribute.query]: { 
          $regex: searchValue, 
          $options: 'i' 
        }
      })
    });

  const selectedAttributes = attributes
    .filter(({ defaultShow, defaultSearch, name }) => {
      return defaultShow || defaultSearch || new RegExp(name).test(searchAttributes)
    }).map(({ name }) => name)

  if (!query.$or.length) {
    delete query.$or
  }

  return {
    attributes,
    selectedAttributes,
    query
  }
  
}

const withConditionalRendering = compose(
  withTracker(attributeTracker),
  withEither(isLoading, Loading),
  withTracker(searchTracker)
)

/**
 * Dynamic table for displaying gene information with columns that can be queried and configured
 * @param { array } [attributes] array of gene attributes that will be shown as columns
 * @kind {class}
 */
class GeneTable extends React.PureComponent {
  constructor(props){
    super(props)
    this.state = {
      limit: 20,
      query: {},
      sort: undefined,
      currentQueryCount: '...',
      selectedGenes: new Set(),
      selectedAllGenes: false,
      selectedColumns: new Set(),
      selectedVisualization: VISUALIZATIONS[0],
      showDownloadDialog: false,
      dummy: 0
    }
  }

  static getDerivedStateFromProps =  (props, state) => {
    const { query: newQuery, currentQueryCount, selectedAttributes } = props;
    const { query: oldQuery } = state;
    const query = Object.assign({}, oldQuery, newQuery);
    if (isEmpty(newQuery)){
      delete query.$or;
    }
    const selectedColumns = new Set(['Gene ID', ...state.selectedColumns, ...selectedAttributes]);
    return {
      query,
      selectedColumns
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (!isEqual(this.props.query, prevProps.query)){
      queryCount.call({ query: this.props.query }, (err,res) => {
        const currentQueryCount = new Intl.NumberFormat().format(res);
        this.setState({ currentQueryCount });
      })
    }
  }

  componentDidMount = () => {
    const { query } = this.state;
    queryCount.call({ query }, (err,res) => {
      const currentQueryCount = new Intl.NumberFormat().format(res);
      this.setState({ currentQueryCount });
    })
  }

  updateScrollLimit = limit => {
    this.setState({ limit });
  }

  updateQuery = query => {
    queryCount.call({ query }, (err,res) => {
      const currentQueryCount = new Intl.NumberFormat().format(res);
      this.setState({
        query,
        currentQueryCount,
        dummy: this.state.dummy + 1
      })
    })
  }

  updateSort = sort => {
    this.setState({ 
      sort: sort,
      dummy: this.state.dummy + 1 //weird hack to force updating if sort object changes.
    });
  }

  updateSelection = event => {
    const geneId = event.target.id;
    this.setState(({ selectedGenes }) => {
      if (!selectedGenes.has(geneId)){
        selectedGenes.add(geneId)
      } else {
        selectedGenes.delete(geneId)
      }
      return {
        selectedGenes: cloneDeep(selectedGenes)
      }
    })
  }


  toggleDownloadDialog = () => {
    this.setState({
      showDownloadDialog: !this.state.showDownloadDialog
    })
  }

  toggleSelectAllGenes = () => {
    //Set selectedAllGenes to false if a selection is made, 
    //otherwise toggle current selectAllGenes state
    const selectedAllGenes = this.state.selectedGenes.size > 0 ? false : !this.state.selectedAllGenes;
    this.setState({
      selectedGenes: new Set(),
      selectedAllGenes: selectedAllGenes
    })
  }

  toggleColumnSelect = event => {
    const {checked, id, ...target} = event.target;
    this.setState(({ selectedColumns , ...oldState }) => {
      if (selectedColumns.has(id)){
        selectedColumns.delete(id)
      } else {
        selectedColumns.add(id)
      }
      return { 
        selectedColumns: cloneDeep(selectedColumns) 
      }
    })
  }

  toggleVisualization = event => {
    const selectedVisualization = event.target.id;
    this.setState({ selectedVisualization });
  }

  render(){
    const { attributes } = this.props;
    const { limit, query, sort, currentQueryCount, selectedGenes,
    selectedAllGenes, selectedColumns, selectedVisualization,
    showDownloadDialog, dummy } = this.state;
    
    const headerOptions = { selectedColumns, selectedGenes, selectedAllGenes,
      toggleSelectAllGenes: this.toggleSelectAllGenes, selectedVisualization,
      updateQuery: this.updateQuery, query, updateSort: this.updateSort, 
      sort, attributes };
    
    const bodyOptions = { query, sort, limit, selectedGenes, selectedAllGenes, 
      updateSelection: this.updateSelection, selectedColumns, attributes, 
      selectedVisualization, updateScrollLimit: this.updateScrollLimit };

    const downloadOptions = { selectedGenes, showDownloadDialog, selectedAllGenes,
      query, toggleDownloadDialog: this.toggleDownloadDialog };
    
    return <div className='container-fluid px-0 mx-0 genetable'>
      <div className='table-responsive'>
        <div className="card genetable-wrapper my-2">
          <div className="card-header d-flex justify-content-between px-1 py-1">
            <FilterOptions 
              toggleColumnSelect={this.toggleColumnSelect}
              toggleVisualization={this.toggleVisualization}
              updateQuery={this.updateQuery} 
              {...this.props} {...this.state} />
            <button type='button' className='btn btn-sm btn-outline-dark px-2 mx-2 py-0 border query-count' disabled>
              <span className='badge badge-dark'>
                { currentQueryCount }
              </span> query results
            </button>
            <SelectionOptions 
              toggleSelectAllGenes={this.toggleSelectAllGenes} 
              toggleDownloadDialog={this.toggleDownloadDialog}
              {...this.props} {...this.state} />
          </div>
          <table className='genetable table table-hover table-sm'>
            <GeneTableHeader {...headerOptions} />
            <GeneTableBody {...bodyOptions} />
          </table>
        </div>
      </div>
      <DownloadDialogModal {...downloadOptions} />
    </div>
  }
}


export default withConditionalRendering(GeneTable);

