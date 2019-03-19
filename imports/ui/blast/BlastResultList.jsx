/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Link } from 'react-router-dom';

import { Genes } from '/imports/api/genes/gene_collection.js';

const AlignmentText = ({ hsp }) => {
  const queryStart = hsp['Hsp_query-from'][0];
  const hspStart = hsp['Hsp_hit-from'][0];

  const queryPaddingSize =    queryStart.length >= hspStart.length
      ? 0
      : hspStart.length - queryStart.length;
  const midLinePaddingSize = Math.max(queryStart.length, hspStart.length);
  const subjectPaddingSize =    hspStart.length >= queryStart.length
      ? 0
      : queryStart.length - hspStart.length;

  const queryPadding = ' '.repeat(queryPaddingSize + 3);
  const midLinePadding = ' '.repeat(midLinePaddingSize + 9);
  const subjectPadding = ' '.repeat(subjectPaddingSize + 1);

  const queryTag = `Query${queryPadding}${queryStart} `;
  const subjectTag = `Subject${subjectPadding}${hspStart} `;

  const querySeq = hsp.Hsp_qseq[0];
  const midLineSeq = hsp.Hsp_midline[0];
  const subjectSeq = hsp.Hsp_hseq[0];
  return (
    <pre className="alignment-text">
      {queryTag}
      {querySeq}
      <br />
      {midLinePadding}
      {midLineSeq}
      <br />
      {subjectTag}
      {subjectSeq}
    </pre>
  );
};

function BlastAlignment({ hit }) {
  return (
    <ul className="list-group">
      {hit.Hit_hsps.map((_hsp) => {
        const hsp = _hsp.Hsp[0];
        return (
          <li className="list-group-item border" key={hsp.Hsp_evalue[0]}>
            <AlignmentText hsp={hsp} />
          </li>
        );
      })}
    </ul>
  );
}

function blastHitDataTracker({ hit }) {
  const [geneId, transcriptId] = hit.Hit_def[0].split(' ');
  const geneSub = Meteor.subscribe('singleGene', { geneId });
  const gene = Genes.findOne({ ID: geneId });
  const loading = !geneSub.ready();
  return {
    geneId,
    transcriptId,
    gene,
    hit,
    loading,
  };
}

function Badge({ label, value, color }) {
  return (
    <div className="btn-group">
      <button
        type="button"
        className={`btn btn-sm btn-${color} py-0 ml-2 mb-1`}
        disabled
      >
        {label}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-dark py-0 mr-2 mb-1 border"
        disabled
      >
        {value}
      </button>
    </div>
  );
}

function HitLine({
 geneId, transcriptId, gene, hit, loading 
}) {
  return (
    <div>
      <Link to={`/gene/${geneId}`}>{transcriptId}</Link>
      <small>
        <Badge
          label="E-value"
          value={hit.Hit_hsps[0].Hsp[0].Hsp_evalue[0]}
          color="primary"
        />
        {!loading && gene.attributes.Name ? (
          <Badge label="Name" value={gene.attributes.Name} color="success" />
        ) : null}
        {!loading && gene.orthogroupId ? (
          <Badge label="Orthogroup" value={gene.orthogroupId} color="warning" />
        ) : null}
      </small>
      <BlastAlignment hit={hit} />
    </div>
  );
}

const HitLineWithTracker = withTracker(blastHitDataTracker)(HitLine);

export default function BlastResultList({ blastResult }) {
  const { BlastOutput_iterations } = blastResult.BlastOutput; // eslint-disable-line camelcase
  const hits = BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
  return (
    <ul className="list-group list-group-flush">
      {hits.map(hit => (
        <li className="list-group-item" key={hit.Hit_id[0]}>
          <HitLineWithTracker hit={hit} />
        </li>
      ))}
    </ul>
  );
}
