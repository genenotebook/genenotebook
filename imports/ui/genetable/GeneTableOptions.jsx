import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { Attributes } from '/imports/api/genes/attribute_collection.js';

import { queryCount } from '/imports/api/methods/queryCount.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import FilterOptions from './filteroptions/FilterOptions.jsx';
import { SelectionOptions } from './SelectionOptions.jsx';

export const VISUALIZATIONS =['Gene model', 'Protein domains', 'Gene expression'];

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const tableColumnDataTracker = props => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = Attributes.find({show: true}).fetch();
  return {
    loading, 
    attributes
  }
}

/**
 * [withConditionalRendering description]
 * @type {[type]}
 */
const withConditionalRendering = compose(
  withTracker(tableColumnDataTracker),
  withEither(isLoading, Loading)
)


class GeneTableOptions extends React.PureComponent {
  constructor(props){
    super(props)
    this.state = {
      scrollLimit: 50,
      query: {},
      queryCount: '...',
      selectedGenes: new Set(),
      selectedAllGenes: false,
      selectedColumns: new Set(['Gene ID', 'Note']),
      selectedVisualization: VISUALIZATIONS[0],
      showDownloadDialog: false
    }
  }

  componentDidMount = () => {
    const { query } = this.state;
    queryCount.call({ query }, (err,res) => {
      this.setState({
        queryCount: res
      })
    })
  }

  updateScrollLimit = newScrollLimit => {
    this.setState({
      scrollLimit: newScrollLimit
    })
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

  renderChildren = props => {
    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        updateSelection: this.updateSelection,
        updateQuery: this.updateQuery,
        updateScrollLimit: this.updateScrollLimit,
        toggleSelectAllGenes: this.toggleSelectAllGenes,
        toggleDownloadDialog: this.toggleDownloadDialog,
        ...this.state,
        ...this.props
      })
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

  updateQuery = query => {
    queryCount.call({ query }, (err,res) => {
      this.setState({
        query: query,
        queryCount: res
      })
    })
  }

  render(){
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between px-1 py-1">
          <FilterOptions 
            toggleColumnSelect={this.toggleColumnSelect}
            toggleVisualization={this.toggleVisualization}
            updateQuery={this.updateQuery} 
            {...this.props} {...this.state} />
          <button type='button' className='btn btn-sm btn-outline-dark px-2 mx-2 py-0' disabled>
            <span className='badge badge-dark'>
              { 
                new Intl.NumberFormat().format(this.state.queryCount)
              }
            </span> query results
          </button>
          <SelectionOptions 
            toggleSelectAllGenes={this.toggleSelectAllGenes} 
            toggleDownloadDialog={this.toggleDownloadDialog}
            {...this.props} {...this.state} />
        </div>
        {
          this.renderChildren()
        }
      </div>
    )
  }
}

export default withConditionalRendering(GeneTableOptions);
