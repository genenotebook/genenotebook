import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';
import randomColor from 'randomcolor';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';


const isLoading = ({ loading }) => loading;

const Loading = ({ transcriptId, x ,y }) => {
  return <g>
    <circle cy={x} cx={y} r='5' />
    <foreignObject width='300' height='10' x={y + 10} y={x - 15}>
      <span style={{fontSize: 10}}> ...{transcriptId} </span>
    </foreignObject>
  </g>
}

const isNotFound = ({ gene }) => typeof gene === 'undefined';

const NotFound = ({ transcriptId }) => {
  return <g>
    <circle cy={x} cx={y} r='5' />
    <foreignObject width='300' height='10' x={y + 10} y={x - 15}>
      <span style={{fontSize: 10}}>{transcriptId}</span>
    </foreignObject>
  </g>
}


const OrthogroupTipNode = ({ transcriptId, gene, x, y }) => {
  const { genomeId } = gene;
  const fill = randomColor({ seed: genomeId + genomeId.slice(3) });
  const style = { fill };
  return <g>
    <circle cy={x} cx={y} r='4.5' style={style}/>
    <foreignObject width='300' height='10' x={y + 10} y={x - 13}>
      <a href={`${Meteor.absoluteUrl()}gene/${gene.ID}`} style={{fontSize: 10}}>
        {transcriptId} {gene.attributes.Name}
      </a>
    </foreignObject>
  </g>
}

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
