import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Preview, previewDataTracker } from './Preview.jsx';

function formatFasta({ gene, seqType }) {
  const sequences = getGeneSequences(gene);
  const fastaLines = sequences.map((seq) => {
    const seqLines = seq[seqType].match(/.{1,60}/g);
    return [`>${seq.ID}`, ...seqLines];
  });
  return [].concat(...fastaLines);
}

function hasNoPreview({ previewGenes, seqType }) {
  return typeof previewGenes === 'undefined' || typeof seqType === 'undefined';
}

function SequencePreview({ loading, previewGenes, options: { seqType } }) {
  return (
    <Preview>
      { loading || hasNoPreview({ previewGenes, seqType }) ? (
        '...loading...'
      ) : (
        previewGenes.map((gene) => formatFasta({ gene, seqType }).map((fastaLine) => (
          <span key={fastaLine}>
            {fastaLine}
            <br />
          </span>
        )))

      )}
    </Preview>
  );
}

export default withTracker(previewDataTracker)(SequencePreview);
