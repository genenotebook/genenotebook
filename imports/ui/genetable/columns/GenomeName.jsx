import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

// import React from 'react';
import { compose, branch, renderComponent } from 'recompose';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

function hasOwnProperty(obj, prop) {
  return Object.hasOwnProperty.call(obj, prop);
}

function dataTracker({ genomeId, genomeDataCache }) {
  let genome;
  let genomeSub;
  if (hasOwnProperty(genomeDataCache, genomeId)) {
    genome = genomeDataCache[genomeId];
  } else {
    genomeSub = Meteor.subscribe('genomes');
    genome = genomeCollection.findOne({ _id: genomeId });
    genomeDataCache[genomeId] = genome;
  }
  const loading = typeof genomeSub !== 'undefined'
    ? !genomeSub.ready()
    : false;
  return {
    loading,
    genome,
  };
}

function GenomeName({ genome }) {
  return genome.name;
}

export default compose(
  withTracker(dataTracker),
  branch(isLoading, renderComponent(Loading)),
)(GenomeName);
