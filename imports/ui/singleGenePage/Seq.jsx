import React, { useState } from 'react';
import find from 'lodash/find';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './seq.scss';

function Controls({
  seqType, setSeqType, transcripts, setSelectedTranscript, selectedTranscript,
}) {
  const seqTypes = ['nucl', 'prot'];
  return (
    <>
      <div className="buttons are-small has-addons sequence-toggle is-pulled-right" role="group">
        {
        seqTypes.map((sType) => {
          const active = sType === seqType ? 'is-info is-light' : '';
          const label = sType === 'prot' ? 'Protein' : 'Nucleotide';
          return (
            <button
              key={sType}
              id={sType}
              type="button"
              onClick={() => setSeqType(sType)}
              className={`button ${active}`}
            >
              { label }
            </button>
          );
        })
      }
      </div>
      <div className="field has-addons is-pulled-right">
        <div className="control">
          <button type="button" className="button is-small is-static">
            { selectedTranscript }
          </button>
        </div>
        <div className="control">
          <div className="dropdown is-hoverable is-right">
            <div className="dropdown-trigger">
              <button type="button" className="button is-small">
                V
              </button>
            </div>

            <div className="dropdown-menu" role="menu">
              <div className="dropdown-content">
                <div className="dropdown-item">
                  <h6 className="is-h6 dropdown-item dropdown-header">
                    Select transcript:
                  </h6>
                </div>

                {
                  transcripts.map((transcript) => (
                    <div key={transcript} className="dropdown-item">
                      <a onClick={() => setSelectedTranscript(transcript)}>
                        { transcript }
                      </a>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Seq({
  header, sequence, maxLength, fontSize,
}) {
  const [showAll, setShowAll] = useState(false);
  const exceedsMaxLength = sequence.length > maxLength;
  const showSequence = showAll
    ? sequence
    : `${sequence.slice(0, maxLength)}
      ${exceedsMaxLength ? '...' : ''}`;
  const buttonText = showAll
    ? 'Show less'
    : 'Show more ...';
  return (
    <>
      <p className="seq" style={{ fontSize }}>
        {`>${header} `}
        <br />
        {showSequence}
      </p>
      {exceedsMaxLength
        && (
          <button
            type="button"
            className="is-link"
            onClick={() => setShowAll(!showAll)}
          >
            <small>{buttonText}</small>
          </button>
        )}
    </>
  );
}

export default function SeqContainer({ gene, maxLength = 1200 }) {
  const transcripts = gene.subfeatures
    .filter((sub) => sub.type === 'mRNA')
    .map((transcript) => transcript.ID)
    .sort();
  const [selectedTranscript, setSelectedTranscript] = useState(transcripts[0]);
  const [seqType, setSeqType] = useState('nucl');

  const sequences = getGeneSequences(gene);
  const sequence = find(sequences, { ID: selectedTranscript });

  return (
    <div id="sequence">
      <hr />
      <Controls
        selectedTranscript={selectedTranscript}
        setSelectedTranscript={setSelectedTranscript}
        transcripts={transcripts}
        seqType={seqType}
        setSeqType={setSeqType}
      />
      <h4 className="subtitle is-4">Coding Sequence</h4>
      <div className="card seq-container">
        <Seq
          header={selectedTranscript}
          sequence={sequence[seqType]}
          maxLenght={maxLength}
          fontSize=".8rem"
        />
      </div>
    </div>
  );
}
