import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { ExperimentInfo }
  from '/imports/api/transcriptomes/transcriptome_collection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GenomeExperiment from './GenomeExperiment.jsx';

import './AdminTranscriptomes.scss';


function dataTracker() {
  const expInfoSub = Meteor.subscribe('experimentInfo');
  const experiments = ExperimentInfo.find({}).fetch();

  const genomeSub = Meteor.subscribe('genomes');
  const genomes = genomeCollection.find({}).fetch();

  const loading = !expInfoSub.ready() || !genomeSub.ready();
  return {
    experiments,
    genomes,
    loading,
  };
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
);

function AdminTranscriptomes({ experiments, genomes }) {
  return (
    <div>
      <hr />
      <ul className="list-group list-group-flush">
        {
        genomes.map((genome) => {
          const genomeExperiments = experiments.filter((experiment) => experiment.genomeId === genome._id);
          return (
            <li className="list-group-item" key={genome._id}>
              <GenomeExperiment
                genome={genome}
                experiments={genomeExperiments}
              />
            </li>
          );
        })
      }
      </ul>
    </div>
  );
}

export default withConditionalRendering(AdminTranscriptomes);
