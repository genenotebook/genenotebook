import React from 'react';

/**
 * [description]
 * @param  {Set} options.selectedGenes      [description]
 * @param  {Boolean} options.selectedAllGenes        [description]
 * @param  {Function} options.toggleSelectAllGenes    [description]
 * @param  {Function} options.openDownloadDialog [description]
 * @return {Function}                            [description]
 */
const SelectionOptions = ({ selectedGenes , selectedAllGenes, toggleSelectAllGenes, toggleDownloadDialog }) => {
  return (
    Array.from(selectedGenes).length > 0 || selectedAllGenes ?
    <div className="btn-group btn-group-sm" role="group">
      <button type="button" className="btn btn-success" onClick={toggleDownloadDialog}>
        <i className="fa fa-download" aria-hidden="true"></i> Download 
      </button>
      <button type="button" className="btn btn-warning" data-toggle="modal" data-target="#download-modal">
        <i className="fa fa-external-link" aria-hidden="true"></i> Send 
      </button>
      <button type="button" className="btn btn-dark select-all" onClick={toggleSelectAllGenes}>
        Unselect all <i className="fa fa-check checked" aria-hidden="true"></i>
      </button>
    </div> :
    <button type="button" className="btn btn-sm btn-outline-dark select-all" onClick={toggleSelectAllGenes}>
      Select all <i className="fa fa-check unchecked" aria-hidden="true"></i>
    </button>
  )
}

export default SelectionOptions;