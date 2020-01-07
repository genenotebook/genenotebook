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

  const roleSub = Meteor.subscribe('roles');
  const roles = Meteor.roles.find({}).fetch();

  const loading = !expInfoSub.ready() || !genomeSub.ready() || !roleSub.ready();
  return {
    experiments,
    genomes,
    loading,
    roles,
  };
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
);

function AdminTranscriptomes({ experiments, genomes, roles }) {
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
                roles={roles}
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

/*
class AdminTranscriptomes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: [],
    };
  }

  toggleExpand = (event) => {
    event.preventDefault();
    const trackName = event.target.id;
    const index = this.state.expanded.indexOf(trackName);
    const operation = index < 0 ? { $push: [trackName] } : { $splice: [[index]] };
    const newState = update(this.state, { expanded: operation });

    this.setState(newState);
  }

  render() {
    const { experiments, genomes, roles } = this.props;
    return (
      <div>
        <hr />
        <ul className="list-group list-group-flush">
          {
          genomes.map((genome) => {
            const genomeExperiments = experiments.filter((experiment) => experiment.genomeId === genome._id);
            return (
              <li className="list-group-item" key={genome._id}>
                <GenomeExperiment {...{ roles, genome, experiments: genomeExperiments }} />
              </li>
            );
          })
        }
        </ul>
      </div>
    );
  }
}
*/

export default withConditionalRendering(AdminTranscriptomes);
