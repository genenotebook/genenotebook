import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { Link } from 'react-router-dom';
import randomColor from 'randomcolor';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { branch, compose } from '/imports/ui/util/uiUtil.jsx';

import './orthogroup.scss';

function isLoading({ loading }) {
  return loading;
}

function Loading({ transcriptId, x, y }) {
  const style = { fill: 'lightgrey' };
  return (
    <g>
      <circle cy={x} cx={y} r="5" style={style} />
      <foreignObject width="300" height="20" x={y + 10} y={x - 13}>
        <span style={{ fontSize: 10 }}>
          {` ...${transcriptId} `}
        </span>
      </foreignObject>
    </g>
  );
}

function isNotFound({ gene }) {
  return typeof gene === 'undefined';
}

function NotFound({ transcriptId, x, y }) {
  const style = { fill: 'lightgrey' };
  return (
    <g>
      <circle cy={x} cx={y} r="5" style={style} />
      <foreignObject width="300" height="20" x={y + 10} y={x - 13}>
        <span style={{ fontSize: 10 }}>{transcriptId}</span>
      </foreignObject>
    </g>
  );
}

/**
 * Orthogroup phylogenetic tree tipnode with reactive data link for genes in the database
 * @param  {String} options.transcriptId [description]
 * @param  {Object} options.gene         [description]
 * @param  {Number} options.x            [description]
 * @param  {Number} options.y            [description]
 * @return {Stateless React Component}                      [description]
 */
function OrthogroupTipNode({
  transcriptId, gene, x, y, chronogram,
}) {
  const { genomeId } = gene;
  const fill = randomColor({ seed: genomeId + genomeId.slice(3) });
  const style = { fill };
  return (
    <g className="tipnode">
      <circle className="orthogroup-node" cy={x} cx={y} r="4.5" style={style} />
      <foreignObject width="300" height="20" x={y + 10} y={x - 13}>
        <Link to={`/gene/${gene.ID}`} style={{ fontSize: 10 }}>
          {`${transcriptId} ${gene.attributes.Name || ''}`}
        </Link>
      </foreignObject>
    </g>
  );
}

/**
 * [description]
 * @param  {Object}    options.data  Phylogenetic tree node data
 * @param  {...[Object]} options.props [description]
 * @return {Object}                  [description]
 */
function geneLinkDataTracker({ data, ...props }) {
  const transcriptId = data.name;
  const geneSub = Meteor.subscribe('singleGene', { transcriptId });
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ 'subfeatures.ID': transcriptId });
  return {
    loading, gene, transcriptId, ...props,
  };
}

export default compose(
  withTracker(geneLinkDataTracker),
  branch(isLoading, Loading),
  branch(isNotFound, NotFound),
)(OrthogroupTipNode);
