/* eslint-disable jsx-a11y/label-has-associated-control */
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
      <div className="field">
        <label className="label">Sequence type</label>
        <div className="control">
          {['nucl', 'prot'].map((seqTypeOption) => {
            const checked = seqType === seqTypeOption ? 'checked' : '';
            return (
              <label className="radio">
                <input
                  type="radio"
                  id={seqTypeOption}
                  checked={checked}
                  onChange={() => {
                    updateOptions({
                      seqType: seqTypeOption,
                    });
                  }}
                />
                {seqTypeOption === 'nucl' ? 'Nucleotide' : 'Protein'}
              </label>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="label">
          File format
        </label>
        <div className="control">
          <label className="checkbox">
            <input
              className="form-check-input"
              type="checkbox"
              id="file-format"
              defaultChecked
              disabled
            />
            { fileFormat }
          </label>
        </div>
      </div>

      <div className="field">
        <label className="label">
          Isoforms
        </label>
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              id="primary-transcript-only"
              checked={primaryTranscriptOnly}
              onChange={() => {
                updateOptions({
                  primaryTranscriptOnly: !primaryTranscriptOnly,
                });
              }}
            />
            Primary transcript only
          </label>
        </div>
      </div>
    </form>
  );
}

export default SequenceDownloadOptions;
