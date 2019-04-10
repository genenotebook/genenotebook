import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React, { useState } from 'react';
import { scaleLinear } from 'd3';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { GenemodelGroup, XAxis } from '/imports/ui/singleGenePage/Genemodel.jsx';

function dataTracker({ seqid = 'chr1', browserStart = 8400000, browserEnd = 8600000 }) {
  const query = {
    seqid,
    $and: [{ end: { $gt: browserStart } }, { start: { $lt: browserEnd } }],
  };
  const subscription = Meteor.subscribe('genes', { query });
  const loading = !subscription.ready();
  const genes = Genes.find(query).fetch();
  return {
    loading,
    genes,
    browserStart,
    browserEnd,
    seqid,
  };
}

function Browser({
  genes, browserStart, browserEnd, seqid,
}) {
  const [width, setWidth] = useState(1000);

  const height = 14 * 5 + 46;

  const margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };

  const scale = scaleLinear()
    .domain([browserStart, browserEnd])
    .range([margin.left, width - margin.right]);

  return (
    <div className="browser">
      <svg width={width} height={height} className="genemodel-container">
        {genes.map((gene) => {
          const transcripts = gene.subfeatures.filter(subfeature => subfeature.type === 'mRNA');
          return (
            <GenemodelGroup gene={gene} transcripts={transcripts} width={width} scale={scale} />
          );
        })}
        <XAxis scale={scale} numTicks="5" transform={`translate(0,${height - 22})`} seqid={seqid} />
        <defs>
          <marker id="arrowEnd" markerWidth="15" markerHeight="10" refX="0" refY="5" orient="auto">
            <path d="M0,5 L15,5 L10,10 M10,0 L15,5" fill="none" stroke="black" strokeWidth="1" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export default withTracker(dataTracker)(Browser);
