import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';

import { Genes } from '/imports/api/genes/gene_collection.js';

const withEither = (conditionalRenderingFn, EitherComponent) => (Component) => (props) =>
  conditionalRenderingFn(props)
    ? <EitherComponent { ...props }/>
    : <Component { ...props } />

const Loading = (props) => {
  return <span style={{fontSize: 10}}>...{props.transcriptId}</span>
}

const NotFound = (props) => {
  return <span style={{fontSize: 10}}>{props.transcriptId}</span>
}

const GeneLink = props => {
  return (
    <a href={`/gene/${props.geneId}`} style={{fontSize: 10}}>
      {props.transcriptId}
    </a>
  )
}

const isLoading = props => {
  return props.loading;
}

const isNotFound = props => {
  return typeof props.gene === 'undefined';
}

const withConditionalRendering = compose(
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound)
)

export default withTracker(({geneId, transcripId }) => {
  const geneSub = Meteor.subscribe('singleGene', geneId);
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ID: geneId});
  return {
    loading,
    geneId,
    transcripId,
    gene
  }
})(withConditionalRendering(GeneLink));

