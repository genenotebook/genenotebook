/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Link } from 'react-router-dom';

import { Genes } from '/imports/api/genes/gene_collection.js';

// import BlastAlignment from './BlastAlignment.jsx';

function blastHitDataTracker({ hit, RenderComponent }) {
  const [geneId, transcriptId] = hit.Hit_def[0].split(' ');
  const geneSub = Meteor.subscribe('singleGene', { geneId });
  const gene = Genes.findOne({ ID: geneId });
  const loading = !geneSub.ready();
  return {
    geneId,
    transcriptId,
    gene,
    hit,
    RenderComponent,
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
  geneId,
  transcriptId,
  gene,
  hit,
  loading,
  RenderComponent,
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
      <RenderComponent gene={gene} hit={hit} />
    </div>
  );
}

const HitLineWithTracker = withTracker(blastHitDataTracker)(HitLine);

export default function BlastResultList({ blastResult, RenderComponent }) {
  const { BlastOutput_iterations } = blastResult.BlastOutput; // eslint-disable-line camelcase
  const hits = BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
  return (
    <ul className="list-group list-group-flush">
      {hits.map((hit) => (
        <li className="list-group-item" key={hit.Hit_id[0]}>
          <HitLineWithTracker hit={hit} RenderComponent={RenderComponent} />
        </li>
      ))}
    </ul>
  );
}
