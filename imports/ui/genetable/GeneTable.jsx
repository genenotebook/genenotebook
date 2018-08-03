import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

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
const attributeTracker = () => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading, 
    attributes
  }
}

/**
 * [description]
 * @param  {[type]} options.attributes [description]
 * @return {[type]}                    [description]
 */
const searchTracker = ({ attributes }) => {
  FlowRouter.watchPathChange();
  const { queryParams } = FlowRouter.current();
  const { attributes: attributeString, search } = queryParams;
  const query = { $or: [] };
  attributes
    .filter(({ name }) => new RegExp(name).test(attributeString) )
    .forEach(attribute => {
      query.$or.push({ 
        [attribute.query]: { 
          $regex: search, 
          $options: 'i' 
        }
      })
    });

  const selectedAttributes = attributes
    .filter(({ defaultShow, defaultSearch, name }) => {
      return defaultShow || defaultSearch || new RegExp(name).test(attributeString)
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

class GeneTable extends React.Component {
  constructor(props){
    super(props)
    const { query = {}, selectedAttributes } = props;
    const selectedColumns = new Set(['Gene ID'].concat(selectedAttributes))
    console.log(selectedColumns)
    this.state = {
      limit: 40,
      query: query,
      sort: undefined,
      queryCount: '...',
      selectedGenes: new Set(),
      selectedAllGenes: false,
      selectedColumns: selectedColumns,
      selectedVisualization: VISUALIZATIONS[0],
      showDownloadDialog: false,
      dummy: 0
    }
  }

  static getDerivedStateFromProps = async (props, state) => {
    const { query = {} } = props;
    const selectedColumns = new Set(state.selectedColumns).add('Gene ID');
    const _queryCount = await queryCount.call({ query });
    return {
      query,
      selectedColumns,
      queryCount: _queryCount
    }
  }

  componentDidMount = () => {
    const { query } = this.state;
    queryCount.call({ query }, (err,res) => {
      this.setState({
        queryCount: new Intl.NumberFormat().format(res)
      })
    })
  }

  updateScrollLimit = limit => {
    this.setState({ limit });
  }

  updateQuery = query => {
    queryCount.call({ query }, (err,res) => {
      this.setState({
        query: query,
        queryCount: new Intl.NumberFormat().format(res),
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
    const { limit, query, sort, queryCount, selectedGenes,
    selectedAllGenes, selectedColumns, selectedVisualization,
    showDownloadDialog, dummy } = this.state;
    
    const headerOptions = { selectedColumns, selectedGenes, selectedAllGenes,
      toggleSelectAllGenes: this.toggleSelectAllGenes, selectedVisualization,
      updateQuery: this.updateQuery, query, updateSort: this.updateSort, 
      sort, attributes };
    
    const bodyOptions = { query, sort, limit, selectedGenes, selectedAllGenes, 
      updateSelection: this.updateSelection, selectedColumns, attributes, 
      selectedVisualization, updateScrollLimit: this.updateScrollLimit };

    const downloadOptions = { selectedGenes, showDownloadDialog, 
      toggleDownloadDialog: this.toggleDownloadDialog };
    
    return <div className='container-fluid px-0 mx-0'>
      <div className='table-responsive'>
        <div className="card my-2">
          <div className="card-header d-flex justify-content-between px-1 py-1">
            <FilterOptions 
              toggleColumnSelect={this.toggleColumnSelect}
              toggleVisualization={this.toggleVisualization}
              updateQuery={this.updateQuery} 
              {...this.props} {...this.state} />
            <button type='button' className='btn btn-sm btn-outline-dark px-2 mx-2 py-0' disabled>
              <span className='badge badge-dark'>
                { this.state.queryCount }
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

