import React from 'react';

/**
 * [description]
 * @param  {Set} options.selectedGenes      [description]
 * @param  {Boolean} options.selectedAllGenes        [description]
 * @param  {Function} options.toggleSelectAllGenes    [description]
 * @param  {Function} options.openDownloadDialog [description]
 * @return {Function}                            [description]
 */
export default function SelectionOptions({
  selectedGenes,
  selectedAllGenes,
  toggleDownloadDialog,
}) {
  return Array.from(selectedGenes).length > 0 || selectedAllGenes ? (
    <button
      type="button"
      className="btn btn-sm btn-success px-2 py-0"
      onClick={toggleDownloadDialog}
    >
      <span className="icon-download" aria-hidden="true" />
      Download
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary px-2 py-0 border"
      title="Make a selection to download data"
      disabled
    >
      <span className="icon-block" aria-hidden="true" />
      Download
    </button>
  );
}
