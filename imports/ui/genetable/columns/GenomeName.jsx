import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react'
import { compose } from 'recompose';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

const dataTracker = ({ genomeId }) => {
  const sub = Meteor.subscribe('genomes');
  const loading = !sub.ready();
  const genome = genomeCollection.findOne({ _id: genomeId });
  return {
    loading,
    genome
  }
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading)
)

const GenomeName = ({ genome }) => {
  return genome.name
}

export default withConditionalRendering(GenomeName);