import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { getGeneSequences } from '/imports/api/util/util.js';
import { withEither } from '/imports/ui/util/uiUtil.jsx';

import previewDataTracker from './previewDataTracker.js';

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

function NoPreview() {
  return (
    <div>
      <p>... Loading ...</p>
    </div>
  );
}

function SequencePreview({ previewGenes, seqType }) {
  return (
    <div>
      {previewGenes.map(gene => formatFasta({ gene, seqType }).map(fastaLine => (
        <span key={fastaLine}>
          {fastaLine}
          <br />
        </span>
      )))}
    </div>
  );
}

const SequencePreviewWithCheck = withEither(hasNoPreview, NoPreview)(SequencePreview);

function SequenceDownload({ previewGenes, options }) {
  const { seqType } = options;
  return (
    <div className="card download-preview">
      <div className="card-body">
        <h4 className="card-title">Download preview</h4>
        <SequencePreviewWithCheck previewGenes={previewGenes} seqType={seqType} />
      </div>
    </div>
  );
}

export default withTracker(previewDataTracker)(SequenceDownload);
