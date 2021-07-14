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
  const hasSelectedGenes = Array.from(selectedGenes).length > 0;
  return hasSelectedGenes || selectedAllGenes ? (
    <button
      type="button"
      className="button is-small is-success is-light is-outlined"
      title="Select genes to enable download"
      onClick={toggleDownloadDialog}
    >
      <span className="icon-download" aria-hidden="true" />
      Download
    </button>
  ) : (
    <button
      type="button"
      className="button is-small is-static"
      title="Make a selection to download data"
    >
      <span className="icon-block" aria-hidden="true" />
      Download
    </button>
  );
}
