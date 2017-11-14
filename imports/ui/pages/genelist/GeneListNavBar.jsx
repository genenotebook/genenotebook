const GeneListNavBar = props => {
  return (
    <div className="row justify-content-between">
      
      <div className="dropdown">
        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle" id="dropdownSortMenu">
          <i className="fa fa-sort-alpha-asc" aria-hidden="true"></i> Sort options
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownSortMenu">
          <a className="dropdown-item">Gene ID</a>
          <a className="dropdown-item">Annotation</a>
        </div>
      </div>
      <div>
        <b>{props.queryCount}</b> query results
      </div>
      
      {
        props.selection.length > 0 ?
        <div className="btn-group btn-group-sm" role="group">
          <button type="button" className="btn btn-success" data-toggle="modal" data-target="#download-modal">
            <i className="fa fa-download" aria-hidden="true"></i> Download 
          </button>
          <button type="button" className="btn btn-warning" data-toggle="modal" data-target="#download-modal">
            <i className="fa fa-external-link" aria-hidden="true"></i> Send 
          </button>
          <button type="button" className="btn btn-secondary select-all">
            <i className="fa fa-check checked" aria-hidden="true"></i>
          </button>
        </div> :
        <button type="button" className="btn btn-sm btn-outline-secondary select-all">
          <i className="fa fa-check unchecked" aria-hidden="true"></i>
        </button>
      }
      
    </div>
  )
}

export default GeneListNavBar;