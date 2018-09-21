import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import { isEqual, omit } from 'lodash';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { updateSampleInfo } from '/imports/api/transcriptomes/updateSampleInfo.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import TrackExperiments from './TrackExperiments.jsx';
import GenomeExperiment from './GenomeExperiment.jsx';

import './AdminTranscriptomes.scss';


const dataTracker = props => {
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
    roles
  }
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading)
)

class AdminTranscriptomes extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      expanded: []
    }
  }

  toggleExpand = event => {
    event.preventDefault();
    const trackName = event.target.id;
    const index = this.state.expanded.indexOf(trackName)
    const operation = index < 0 ? { $push: [trackName] } : { $splice : [[index]] };
    const newState = update(this.state, { expanded: operation })
   
    this.setState(newState);
  }

  render(){
    const { experiments, genomes, roles } = this.props;
    console.log(experiments)
    return (
      <div>
        <hr/>
        <ul className='list-group list-group-flush'>
        {
          genomes.map(genome => {
            const genomeExperiments = experiments.filter(experiment => {
              return experiment.genomeId === genome._id
            })
            return <li className='list-group-item' key={genome._id}>
              <GenomeExperiment {...{ roles, genome, experiments: genomeExperiments }} />
            </li>
          })
        }
        </ul>
      </div>
    )
  }
}

export default withConditionalRendering(AdminTranscriptomes);
