import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { withEither } from '/imports/ui/util/uiUtil.jsx';

import BlastResultPlot from './BlastResultPlot.jsx';
import BlastResultList from './BlastResultList.jsx';

import './blastResult.scss';


const Loading = () => {
  return (
    <div> 
      <p> Loading job info...</p>
    </div>
  )
}

const Waiting = () => {
  return (
    <div>
      <p> Waiting for job to start...</p>
    </div>
  )
}

const Running = () => {
  return (
    <div>
      <p> Job is running... </p>
    </div>
  )
}

const notFound = () => {
  return <div>
    <p> Job not found </p>
  </div>
}

const isLoading = props => {
  console.log(`check isLoading: ${props.loading}`)
  return props.loading;
}

const isExistingJob = props => {
  return !(typeof props.job !== 'undefined');
}

const isWaiting = props => {
  const waitingStates = ['waiting','ready']
  const isWaiting = waitingStates.indexOf(props.job.status) > 0;//props.job.status === 'waiting';
  console.log(`check isWaiting ${isWaiting}`);
  return isWaiting;
}

const isRunning = props => {
  const isRunning = props.job.status === 'running';
  console.log(`check isRunning: ${isRunning}`);
  return isRunning;
}

const isFinished = props => {
  const isFinished = props.job.status === 'completed';
  console.log(`check isFinished: ${isFinished}`);
  return isFinished;
}

const withConditionalRendering = compose(
  withEither(isExistingJob, notFound),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running)
)

class BlastResult extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    console.log(this.props)
    return (
      <div className="container">
        <div className='card'>
          <div className='card-header'>
            <b>Blast results</b> <small> Job ID: {this.props.job._id}</small>
          </div>
          <BlastResultPlot blastResult = {this.props.job.result} queryLength = {this.props.job.data.input.length}/>
          <BlastResultList blastResult = {this.props.job.result} />
        </div>
      </div>
    )
  }
}

export default withTracker(props => {
  const subscription = Meteor.subscribe('jobQueue');
  const jobId = FlowRouter.getParam('_id')
  return {
    loading: !subscription.ready(),
    job: jobQueue.findOne({_id: jobId})

  }
})(withConditionalRendering(BlastResult))