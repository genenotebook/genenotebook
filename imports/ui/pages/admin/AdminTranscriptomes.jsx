import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';

class AdminTranscriptomes extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      this.props.loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <ul className='list-group'>
        {
          this.props.experiments.map(experiment => {
            return (
              <li className='list-group-item' key={experiment._id}>
                <p>
                  <a href={`/admin/experiment/${experiment.ID}`}> {experiment.ID} </a>
                </p>
                <ul className='list-group'>
                  <li className='list-group-item'>
                    <small>{`Experiment group: ${experiment.experimentGroup}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>{`Replica group: ${experiment.replicaGroup}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>{`Description: ${experiment.description}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>{`Permissions: ${experiment.permissions}`}</small>
                  </li>
                </ul>
              </li>
            )
          })
        }
        </ul>
      </div>
    )
  }
}

export default createContainer(()=>{
  const subscription = Meteor.subscribe('experimentInfo')
  return {
    experiments: ExperimentInfo.find({}).fetch(),
    loading: !subscription.ready()
  }
},AdminTranscriptomes)