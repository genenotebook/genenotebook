import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { previewDataTracker } from './previewDataTracker.js';

const formatFasta = gene => {
  const transcriptFasta = gene.subfeatures.filter(sub => {
    return sub.type === 'mRNA'
  }).map(transcript => {
    const seqLines = transcript.seq.match(/.{1,60}/g)
    return [`>${transcript.ID}`,...seqLines]
  })
  return [].concat(...transcriptFasta)
}

const SequenceDownload = ({ previewGenes }) => {
  return (
    <div className="card download-preview">
      <div className="card-body">
        <h4 className="card-title">Download preview</h4>
        {
          previewGenes.map(gene => {
            return formatFasta(gene).map(fastaLine => {
              return <span key={fastaLine}>
                {fastaLine}
                <br/>
              </span>
            })
          })
        }
      </div>
    </div>
  )
}

export default withTracker(previewDataTracker)(SequenceDownload);