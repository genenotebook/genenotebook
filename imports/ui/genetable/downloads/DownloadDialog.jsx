import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import AnnotationDownload from './AnnotationDownload.jsx';
import AnnotationDownloadOptions from './AnnotationDownloadOptions.jsx';
import SequenceDownload from './SequenceDownload.jsx';
import SequenceDownloadOptions from './SequenceDownloadOptions.jsx';
import ExpressionDownload from './ExpressionDownload.jsx';
import ExpressionDownloadOptions from './ExpressionDownloadOptions.jsx';

import downloadGenes from '/imports/api/genes/downloadGenes.js';
import getQueryCount from '/imports/api/methods/getQueryCount.js';

import './DownloadDialog.scss';

const DATATYPE_COMPONENTS = {
  Annotations: AnnotationDownload,
  Sequences: SequenceDownload,
  Expression: ExpressionDownload,
};

const OPTION_COMPONENTS = {
  Annotations: AnnotationDownloadOptions,
  Sequences: SequenceDownloadOptions,
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
  const [dataType, setDataType] = useState(Object.keys(DATATYPE_COMPONENTS)[0]);
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
  const DataTypeComponent = DATATYPE_COMPONENTS[dataType];

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
}
