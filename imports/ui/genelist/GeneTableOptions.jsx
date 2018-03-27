import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { Attributes } from '/imports/api/genes/attribute_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import FilterOptions from './filteroptions/FilterOptions.jsx';
import QueryCount from './QueryCount.jsx';
import SelectionOptions from './SelectionOptions.jsx';

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const tableColumnDataTracker = props => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = Attributes.find().fetch();
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

/**
 * 
 */
class GeneTableOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      scrollLimit: 100,
      query: {},
      selectedGenes: new Set(),
      selectedAllGenes: false,
      selectedColumns: new Set(['Name', 'Note']),
      showDownloadDialog: false
    }
  }

  updateSelection = event => {
    const geneId = event.target.id;
    const selectedGenes = cloneDeep(this.state.selectedGenes);
    if (!selectedGenes.has(geneId)){
      selectedGenes.add(geneId)
    } else {
      selectedGenes.delete(geneId)
    }
    this.setState({
      selectedGenes: selectedGenes
    })
  }

  renderChildren = props => {
    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        updateSelection: this.updateSelection,
        toggleDownloadDialog: this.toggleDownloadDialog,
        ...this.state
      })
    })
  }

  toggleDownloadDialog = () => {
    console.log('toggleDownloadDialog')
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
    const column = event.target.id;
    const selectedColumns = cloneDeep(this.state.selectedColumns);
    if (selectedColumns.has(column)){
      selectedColumns.delete(column)
    } else {
      selectedColumns.add(column)
    }
    this.setState({
      selectedColumns
    })
  }

  updateQuery = query => {
    console.log(query)
    this.setState({
      query
    })
  }

  render(){
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between">
          <FilterOptions 
            toggleColumnSelect={this.toggleColumnSelect}
            updateQuery={this.updateQuery} 
            {...this.props} {...this.state} />
          <QueryCount />
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
