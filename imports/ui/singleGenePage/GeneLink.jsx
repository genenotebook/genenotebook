import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';


const isLoading = ({ loading }) => loading;

const Loading = ({ transcriptId }) => <span style={{fontSize: 10}}> ...{transcriptId} </span>


const isNotFound = ({ gene }) => typeof gene === 'undefined';

const NotFound = ({ transcriptId }) => <span style={{fontSize: 10}}>{transcriptId}</span>


const GeneLink = ({ transcriptId, gene }) => {
  return (
    <a href={`${Meteor.absoluteUrl()}gene/${gene.ID}`} style={{fontSize: 10}}>
      {transcriptId} {gene.attributes.Name}
    </a>
  )
}

const geneLinkDataTracker = ({ transcriptId }) => {
  const geneSub = Meteor.subscribe('singleGene', { transcriptId });
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ 'subfeatures.ID': transcriptId });
  return { loading, gene, transcriptId }
}

const withConditionalRendering = compose(
  withTracker(geneLinkDataTracker),
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound)
)

/*
export default withTracker(({ geneId, transcriptId }) => {
  console.log(geneId, transcriptId)
  const geneSub = Meteor.subscribe('singleGene', geneId);
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ ID: geneId });
  console.log(gene)
  return {
    loading,
    geneId,
    transcriptId,
    gene
  }
})(withConditionalRendering(GeneLink));
*/

export default withConditionalRendering(GeneLink);
