/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { ExperimentInfo }
  from '/imports/api/transcriptomes/transcriptome_collection.js';
import { genomeCollection }
  from '/imports/api/genomes/genomeCollection.js';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

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

function AdminTranscriptomes({ experiments, genomes }) {
  return (
    <div className="box">
      <hr />
      <ul className="list is-hoverable">
        {
        genomes.map((genome) => {
          const genomeExperiments = experiments
            .filter((experiment) => experiment.genomeId === genome._id);
          return (
            <li className="list-item" key={genome._id}>
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

export default compose(
  withTracker(dataTracker),
  branch(isLoading, Loading),
)(AdminTranscriptomes);
