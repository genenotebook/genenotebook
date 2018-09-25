import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';
import randomColor from 'randomcolor';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import './orthogroup.scss';

const isLoading = ({ loading }) => loading;

const Loading = ({ transcriptId, x ,y }) => {
  const style = { fill: 'lightgrey' };
  return <g>
    <circle cy={x} cx={y} r='5' style={style} />
    <foreignObject width='300' height='10' x={y + 10} y={x - 15}>
      <span style={{fontSize: 10}}> ...{transcriptId} </span>
    </foreignObject>
  </g>
}

const isNotFound = ({ gene }) => typeof gene === 'undefined';

const NotFound = ({ transcriptId, x ,y }) => {
  const style = { fill: 'lightgrey' };
  return <g>
    <circle cy={x} cx={y} r='5' style={style} />
    <foreignObject width='300' height='10' x={y + 10} y={x - 15}>
      <span style={{fontSize: 10}}>{transcriptId}</span>
    </foreignObject>
  </g>
}

/**
 * Orthogroup phylogenetic tree tipnode with reactive data link for genes in the database
 * @param  {String} options.transcriptId [description]
 * @param  {Object} options.gene         [description]
 * @param  {Number} options.x            [description]
 * @param  {Number} options.y            [description]
 * @return {Stateless React Component}                      [description]
 */
const OrthogroupTipNode = ({ transcriptId, gene, x, y, chronogram }) => {
  const { genomeId } = gene;
  const fill = randomColor({ seed: genomeId + genomeId.slice(3) });
  const style = { fill };
  return <g className='tipnode'>
    <circle className='orthogroup-node' cy={x} cx={y} r='4.5' style={style}/>
    <foreignObject width='300' height='10' x={y + 10} y={x - 13}>
      <a href={`${Meteor.absoluteUrl()}gene/${gene.ID}`} style={{fontSize: 10}}>
        {transcriptId} {gene.attributes.Name}
      </a>
    </foreignObject>
  </g>
}

/**
 * [description]
 * @param  {Object}    options.data  Phylogenetic tree node data
 * @param  {...[Object]} options.props [description]
 * @return {Object}                  [description]
 */
const geneLinkDataTracker = ({ data, ...props }) => {
  const transcriptId = data.name;
  const geneSub = Meteor.subscribe('singleGene', { transcriptId });
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ 'subfeatures.ID': transcriptId });
  return { loading, gene, transcriptId, ...props }
}

const withConditionalRendering = compose(
  withTracker(geneLinkDataTracker),
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound)
)

export default withConditionalRendering(OrthogroupTipNode);
