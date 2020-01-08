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
      <div className="btn-group btn-group-sm sequence-toggle float-right" role="group">
        {
        seqTypes.map((sType) => {
          const active = sType === seqType ? 'active' : 'border';
          const label = sType === 'prot' ? 'Protein' : 'Nucleotide';
          return (
            <button
              key={sType}
              id={sType}
              type="button"
              onClick={() => setSeqType(sType)}
              className={`btn btn-outline-dark px-2 py-0 ${active}`}
            >
              { label }
            </button>
          );
        })
      }
      </div>

      <div className="btn-group btn-group-sm float-right">
        <Dropdown>
          <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
            { selectedTranscript }
          </DropdownButton>
          <DropdownMenu>
            <h6 className="dropdown-header">Select transcript</h6>
            {
          transcripts.map((transcript) => (
            <li key={transcript}>
              <button
                type="button"
                // id={transcript}
                className="btn btn-link select-transcript-seq dropdown-item"
                onClick={() => setSelectedTranscript(transcript)}
              >
                { transcript }
              </button>
            </li>
          ))
        }
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}

export default function SeqContainer({ gene, maxLength = 300 }) {
  const transcripts = gene.subfeatures
    .filter((sub) => sub.type === 'mRNA')
    .map((transcript) => transcript.ID)
    .sort();
  const [selectedTranscript, setSelectedTranscript] = useState(transcripts[0]);
  const [seqType, setSeqType] = useState('nucl');
  const [showAll, setShowAll] = useState(false);

  const sequences = getGeneSequences(gene);
  const sequence = find(sequences, { ID: selectedTranscript });
  const showSequence = showAll
    ? sequence[seqType]
    : `${sequence[seqType].slice(0, maxLength)}...`;
  const buttonText = showAll
    ? 'Show less'
    : 'Show more ...';

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
      <h3>Coding Sequence</h3>
      <div className="card seq-container">
        <p className="seq">
          {`>${selectedTranscript} `}
          <br />
          { showSequence }
        </p>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => setShowAll(!showAll)}
        >
          <small>{ buttonText }</small>
        </button>
      </div>
    </div>
  );
}
