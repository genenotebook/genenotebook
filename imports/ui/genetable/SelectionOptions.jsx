import React from 'react';

/**
 * [description]
 * @param  {Set} options.selectedGenes      [description]
 * @param  {Boolean} options.selectedAllGenes        [description]
 * @param  {Function} options.toggleSelectAllGenes    [description]
 * @param  {Function} options.openDownloadDialog [description]
 * @return {Function}                            [description]
 */
export const SelectionOptions = ({ selectedGenes , selectedAllGenes, toggleDownloadDialog }) => {
  return (
    Array.from(selectedGenes).length > 0 || selectedAllGenes ?
    <button type="button" className="btn btn-sm btn-success px-2 py-0" onClick={toggleDownloadDialog}>
      <span className="fa fa-download" aria-hidden="true" /> Download 
    </button> :
    <button 
      type="button" 
      className="btn btn-sm btn-outline-secondary px-2 py-0"
      title="Make a selection to download data" 
      disabled >  
      <span className="fa fa-ban" aria-hidden="true" /> Download
    </button>
  )
}

export const SelectAll = ({ selectedGenes, selectedAllGenes, toggleSelectAllGenes }) => {
  return (
    Array.from(selectedGenes).length > 0 || selectedAllGenes ?
    <button type="button" className="btn btn-dark btn-sm select-all" onClick={toggleSelectAllGenes}>
      Unselect all <i className="fa fa-check checked" aria-hidden="true"></i>
    </button> : 
    <button type="button" className="btn btn-sm btn-outline-dark select-all" onClick={toggleSelectAllGenes}>
      Select all <i className="fa fa-check unchecked" aria-hidden="true"></i>
    </button>
  )
}

