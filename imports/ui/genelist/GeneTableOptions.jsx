import React from 'react';

const ColumnSelect = props => {
  return (
    <div className="dropdown">
      <button type="button" className="btn btn-sm btn-outline-dark dropdown-toggle" id="dropdownSortMenu" data-toggle="dropdown">
        Select columns
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownSortMenu">
        <h6 className='dropdown-header'>Attributes</h6>
        <a className="dropdown-item" selected>Name</a>
        <a className="dropdown-item" selected>Product</a>
        <a className="dropdown-item">Orthogroup</a>
        <div className="dropdown-divider" />
        <h6 className='dropdown-header'>Data visualizations</h6>
        <a className="dropdown-item">Gene model</a>
        <a className="dropdown-item">Protein domains</a>
        <a className="dropdown-item">Expression</a>
      </div>
    </div>
  )
}

class QueryCount extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      queryCount: '...'
    }
  }
  componentWillReceiveProps = nextProps => {
    //queryCount.call(nextprops.query, (err, res) => {
    //  this.setState({
    //    queryCount: res
    //  })
    //})
  }
  render(){
    return (
      <button type='button' className='btn btn-sm btn-warning' disabled>
        <span className='badge badge-dark'>{this.state.queryCount}</span> query results
      </button>
    )
  }
}

const SelectionOptions = ({ selectedGenes , selectedAll, toggleSelectAll, openDownloadDialog, }) => {
  return (
    Array.from(selectedGenes).length > 0 || selectedAll ?
    <div className="btn-group btn-group-sm" role="group">
      <button type="button" className="btn btn-success" onClick={openDownloadDialog}>
        <i className="fa fa-download" aria-hidden="true"></i> Download 
      </button>
      <button type="button" className="btn btn-warning" data-toggle="modal" data-target="#download-modal">
        <i className="fa fa-external-link" aria-hidden="true"></i> Send 
      </button>
      <button type="button" className="btn btn-dark select-all" onClick={toggleSelectAll}>
        Unselect all <i className="fa fa-check checked" aria-hidden="true"></i>
      </button>
    </div> :
    <button type="button" className="btn btn-sm btn-outline-dark select-all" onClick={toggleSelectAll}>
      Select all <i className="fa fa-check unchecked" aria-hidden="true"></i>
    </button>
  )
}

export default class GeneTableOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      scrollLimit: 100,
      query: {},
      selectedGenes: new Set(),
      selectedAll: false
    }
  }

  toggleSelectAll = () => {
    this.setState({
      selectedGenes: new Set(),
      selectedAll: !this.state.selectedAll
    })
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

  renderChild = props => {
    const child = React.Children.only(this.props.children);
    return React.cloneElement(child, {
      updateSelection: this.updateSelection,
      ...this.state
    })
  }

  render(){
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between">
          <ColumnSelect />
          <QueryCount />
          <SelectionOptions toggleSelectAll={this.toggleSelectAll} {...this.props} {...this.state} />
        </div>
        {
          this.renderChild()
        }
      </div>
    )
  }
}
/*
const GeneTableOptions = ({queryCount, selection, selectedAll, selectAll, openDownloadDialog }) => {
  return (
    <div className="card-header d-flex justify-content-between">
      
      <div className="dropdown">
        <button type="button" className="btn btn-sm btn-outline-dark dropdown-toggle" id="dropdownSortMenu" data-toggle="dropdown">
          Select columns
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownSortMenu">
          <h6 className='dropdown-header'>Attributes</h6>
          <a className="dropdown-item" selected>Name</a>
          <a className="dropdown-item" selected>Product</a>
          <a className="dropdown-item">Orthogroup</a>
          <div className="dropdown-divider" />
          <h6 className='dropdown-header'>Data visualizations</h6>
          <a className="dropdown-item">Gene model</a>
          <a className="dropdown-item">Protein domains</a>
          <a className="dropdown-item">Expression</a>
        </div>
      </div>
      <button type='button' className='btn btn-sm btn-warning' disabled>
        <span className='badge badge-dark'>{queryCount}</span> query results
      </button>
      
      {
        Array.from(selection).length > 0 || selectedAll ?
        <div className="btn-group btn-group-sm" role="group">
          <button type="button" className="btn btn-success" onClick={openDownloadDialog}>
            <i className="fa fa-download" aria-hidden="true"></i> Download 
          </button>
          <button type="button" className="btn btn-warning" data-toggle="modal" data-target="#download-modal">
            <i className="fa fa-external-link" aria-hidden="true"></i> Send 
          </button>
          <button type="button" className="btn btn-dark select-all" onClick={()=>{selectAll(false)}}>
            Unselect all <i className="fa fa-check checked" aria-hidden="true"></i>
          </button>
        </div> :
        <button type="button" className="btn btn-sm btn-outline-dark select-all" onClick={()=>{selectAll(true)}}>
          Select all <i className="fa fa-check unchecked" aria-hidden="true"></i>
        </button>
      }
      
    </div>
  )
}

export default GeneTableOptions
*/