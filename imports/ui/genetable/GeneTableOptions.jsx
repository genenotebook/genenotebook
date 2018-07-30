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

export const VISUALIZATIONS =['Gene model', 'Protein domains', 'Gene expression'];

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const attributeTracker = () => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({show: true}).fetch();
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
  const query = {};
  attributes
    .filter(({ name }) => new RegExp(name).test(attributeString) )
    .forEach(attribute => query[attribute.query] = { $eq: search })

  const selectedAttributes = attributes
    .filter(({ defaultShow, defaultSearch, name }) => {
      return defaultShow || defaultSearch || new RegExp(name).test(attributeString)
    }).map(({ name }) => name)
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


class GeneTableOptions extends React.PureComponent {
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

  static getDerivedStateFromProps = (props, state) => {
    const { query = {} } = props;
    const selectedColumns = new Set(state.selectedColumns).add('Gene ID');
    return {
      query,
      selectedColumns
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

  updateScrollLimit = limit => {
    this.setState({ limit });
  }

  updateQuery = query => {
    queryCount.call({ query }, (err,res) => {
      this.setState({
        query: query,
        queryCount: new Intl.NumberFormat().format(res)
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

  renderChildren = props => {
    console.log(this.state)
    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        updateSelection: this.updateSelection,
        updateQuery: this.updateQuery,
        updateSort: this.updateSort,
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

  render(){
    return (
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
        {
          this.renderChildren()
        }
      </div>
    )
  }
}

export default withConditionalRendering(GeneTableOptions);
