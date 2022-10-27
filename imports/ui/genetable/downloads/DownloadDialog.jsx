/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import AnnotationPreview from './AnnotationPreview.jsx';
import AnnotationDownloadOptions from './AnnotationDownloadOptions.jsx';
import SequencePreview from './SequencePreview.jsx';
import SequenceDownloadOptions from './SequenceDownloadOptions.jsx';
import ExpressionPreview from './ExpressionPreview.jsx';
import ExpressionDownloadOptions from './ExpressionDownloadOptions.jsx';

import downloadGenes from '/imports/api/genes/download/downloadGenes.js';
import getQueryCount from '/imports/api/methods/getQueryCount.js';

import './DownloadDialog.scss';

const PREVIEW_COMPONENTS = {
  Annotation: AnnotationPreview,
  Sequence: SequencePreview,
  Expression: ExpressionPreview,
};

const OPTION_COMPONENTS = {
  Annotation: AnnotationDownloadOptions,
  Sequence: SequenceDownloadOptions,
  Expression: ExpressionDownloadOptions,
};

/**
 * Function that returns the request mongodb.
 * Problem ? When SelectedAllGenes is true it returns not a query but a boolean.
 * @function getDownloadQuery
 * @param {Boolean} selectedAllGenes - Indicates if all genes are selected.
 * @param {Set} selectedGenes - The list of selected genes. (e.g. Set [ "Ciclev10004102m.g.v1.0"])
 * @param {Object} query -
 * @returns {Boolean|Object} - Return the mongodb request.
 */
function getDownloadQuery({ selectedAllGenes, selectedGenes, query }) {
  return selectedAllGenes ? query : { ID: { $in: [...selectedGenes] } };
}

/**
 * The Download DialogModal view.
 * @module
 * @function
 * @param {Function} toggleDownloadDialog -
 * @param {Object} query - The mongodb request.
 * @param {Boolean} selectedAllGenes - Indicates if all genes are selected.
 * @param {Set} selectedGenes - The list of selected genes. (e.g. Set [ "Ciclev10004102m.g.v1.0"])
 */
export default function DownloadDialogModal({
  toggleDownloadDialog,
  query,
  selectedAllGenes,
  selectedGenes,
}) {
  /** By default dataType is Annotation. */
  const [dataType, setDataType] = useState(Object.keys(PREVIEW_COMPONENTS)[0]);
  const [downloading, setDownloading] = useState(false);
  const [queryCount, setQueryCount] = useState('...');
  const [options, setOptions] = useState({});
  const [redirect, setRedirect] = useState(undefined);

  if (typeof redirect !== 'undefined') {
    return <Redirect to={`/download/${redirect}`} />;
  }

  /** Get the mongodb request for download. (e.g. {"ID": { "$in": ["Ciclev10004102m.g.v1.0" ]}} ) */
  const downloadQuery = getDownloadQuery({
    selectedAllGenes,
    selectedGenes,
    query,
  });

  /**
   * Function that changes the states of the hooks for downloading and
   * closes the download dialog.
   * @function closeModal
   * @inner
   */
  function closeModal() {
    setDownloading(false);
    toggleDownloadDialog();
  }

  /**
   * Function that starts downloading data.
   * @function startDownload
   * @inner
   */
  function startDownload() {
    setDownloading(true);
    /**
     * Execute a validatedMethod to launch the download job.
     * Return the hash (md5) of the download.
     */
    downloadGenes.call(
      {
        query: downloadQuery,
        dataType,
        options,
      },
      (err, res) => {
        if (err) console.warn(err);
        setRedirect(res);
      },
    );
  }

  /**
   * Function that changes the states of the hooks for options
   * @function updateOptions
   * @inner
   * @param optionUpdate - Some options.
   */
  function updateOptions(optionUpdate) {
    const newOptions = cloneDeep(options);
    Object.assign(newOptions, optionUpdate);
    setOptions(newOptions);
  }

  /**
   * Execute a validatedMethod to find the "real" number of genes in the
   * collection. (And change the state of the hook).
   * @param {Object} downloadQuery - The mongodb request.
   * @returns {Number} - Return the number of genes in the collection.
   */
  getQueryCount.call({ query: downloadQuery }, (err, res) => {
    if (err) console.error(err);
    setQueryCount(res);
  });

  const OptionComponent = OPTION_COMPONENTS[dataType];
  const PreviewComponent = PREVIEW_COMPONENTS[dataType];

  return (
    <div className="modal download-dialog">
      <div className="modal-background" />
      <div className="modal-card">
        <header className="modal-card-head is-block">
          <div>
            {/* The top right button to close the modal. */}
            <button
              type="button"
              className="delete is-pulled-right"
              aria-label="close"
              onClick={closeModal}
            />
            {/* Indicates the number of genes to download. */}
            <p className="modal-card-title">
              Downloading data for&nbsp;
              {queryCount}
              &nbsp;gene
              {queryCount === 1 ? '' : 's'}
              .
            </p>
          </div>
          <div className="tabs is-centered is-boxed is-fullwidth">
            <ul>
              {/* Annotation, Sequence, Expression previews. */}
              {Object.keys(PREVIEW_COMPONENTS).map((dataTypeOption) => (
                <li
                  key={dataTypeOption}
                  className={dataType === dataTypeOption ? 'is-active' : ''}
                >
                  <a
                    href="#"
                    id={dataTypeOption}
                    onClick={() => {
                      setDataType(dataTypeOption);
                      setOptions({});
                    }}
                  >
                    <span>{dataTypeOption}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </header>
        {/* Download preview for each previews. */}
        <section className="modal-card-body">
          <PreviewComponent query={downloadQuery} options={options} />
        </section>
        {/* Option preview for each previews. */}
        <section className="modal-card-body">
          <OptionComponent options={options} updateOptions={updateOptions} />
        </section>
        {/* The last preview with the 'Download' button. */}
        <footer className="modal-card-foot">
          <button
            type="button"
            className="button is-success is-small is-light is-outlined"
            disabled={downloading}
            onClick={startDownload}
          >
            { downloading ? (
              <>
                <span className="icon-spin" />
                &nbsp;Preparing download URL
              </>
            ) : (
              'Download'
            )}
          </button>
        </footer>
      </div>

    </div>
  );
}
