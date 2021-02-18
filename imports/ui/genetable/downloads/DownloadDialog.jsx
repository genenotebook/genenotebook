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

import downloadGenes from '/imports/api/genes/downloadGenes.js';
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

function getDownloadQuery({ selectedAllGenes, selectedGenes, query }) {
  return selectedAllGenes ? query : { ID: { $in: [...selectedGenes] } };
}

export default function DownloadDialogModal({
  toggleDownloadDialog,
  query,
  selectedAllGenes,
  selectedGenes,
}) {
  const [dataType, setDataType] = useState(Object.keys(PREVIEW_COMPONENTS)[0]);
  const [downloading, setDownloading] = useState(false);
  const [queryCount, setQueryCount] = useState('...');
  const [options, setOptions] = useState({});
  const [redirect, setRedirect] = useState(undefined);

  if (typeof redirect !== 'undefined') {
    return <Redirect to={`/download/${redirect}`} />;
  }

  const downloadQuery = getDownloadQuery({
    selectedAllGenes,
    selectedGenes,
    query,
  });

  function closeModal() {
    setDownloading(false);
    toggleDownloadDialog();
  }

  function startDownload() {
    setDownloading(true);
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

  function updateOptions(optionUpdate) {
    const newOptions = cloneDeep(options);
    Object.assign(newOptions, optionUpdate);
    setOptions(newOptions);
  }

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
            <button
              type="button"
              className="delete is-pulled-right"
              aria-label="close"
              onClick={closeModal}
            />
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
        <section className="modal-card-body">
          <PreviewComponent query={downloadQuery} options={options} />
        </section>
        <section className="modal-card-body">
          <OptionComponent options={options} updateOptions={updateOptions} />
        </section>
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

  /*
  return (
    <div>
      <div className="backdrop" />
      <div className="modal" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Download options</h5>
              <button type="button" className="close" aria-label="Close" onClick={closeModal}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body card">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs">
                  {Object.keys(DATATYPE_COMPONENTS).map((dataTypeOption) => {
                    const active = dataType === dataTypeOption ? 'active' : '';
                    return (
                      <li key={dataTypeOption} className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${active}`}
                          id={dataTypeOption}
                          onClick={() => {
                            setDataType(dataTypeOption);
                            setOptions({});
                          }}
                          href="#"
                        >
                          {dataTypeOption}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="card-body">
                Downloading&nbsp;
                {dataType}
                &nbsp;data for&nbsp;
                {queryCount}
                &nbsp;genes.
                <br />
                Please select further options below.
              </p>
              <DataTypeComponent query={downloadQuery} options={options} />

              <div className="card-body">
                <OptionComponent options={options} updateOptions={updateOptions} />
              </div>
              <div className="modal-footer">
                {downloading ? (
                  <button type="button" className="btn btn-success" disabled>
                    <span className="icon-spin" />
                    &nbsp;Preparing download URL
                  </button>
                ) : (
                  <button type="button" className="btn btn-success" onClick={startDownload}>
                    Download
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  data-dismiss="modal"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  */
}
