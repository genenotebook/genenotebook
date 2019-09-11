/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */
import React, { useState } from 'react';

function SequenceDownloadOptions({ options, updateOptions }) {
  const [initialized, setInitialized] = useState(false);
  const { seqType, fileFormat, primaryTranscriptOnly } = options;
  if (!initialized) {
    updateOptions({
      seqType: 'nucl',
      fileFormat: '.fasta',
      primaryTranscriptOnly: true,
    });
    setInitialized(true);
    return <div>Loading options</div>;
  }
  return (
    <form>
      <div className="row">
        <div className="col-sm-4">Sequence type</div>
        <div className="col-sm-8">
          {['nucl', 'prot'].map((seqTypeOption) => {
            const checked = seqType === seqTypeOption ? 'checked' : '';
            return (
              <div key={seqTypeOption} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id={seqTypeOption}
                  checked={checked}
                  onChange={() => {
                    updateOptions({
                      seqType: seqTypeOption,
                    });
                  }}
                />
                <label className="form-check-label" htmlFor={seqTypeOption}>
                  {seqTypeOption === 'nucl' ? 'Nucleotide' : 'Protein'}
                </label>
              </div>
            );
          })}
        </div>
      </div>
      <div className="row">
        <div className="col-sm-4">File format</div>
        <div className="col-sm-8">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="file-format"
              defaultChecked
              disabled
            />
            <label className="form-check-label" htmlFor="file-format">
              {fileFormat}
            </label>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-4">Primary transcript only</div>
        <div className="col-sm-8">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="primary-transcript-only"
              checked={primaryTranscriptOnly}
              onChange={() => {
                updateOptions({
                  primaryTranscriptOnly: !primaryTranscriptOnly,
                });
              }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default SequenceDownloadOptions;
