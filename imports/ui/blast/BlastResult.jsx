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

const NotFound = () => {
  return <div>
    <p> Job not found </p>
  </div>
}

const NoHits = () => {
  return <div>
    <p> No BLAST hits found </p>
  </div>
}

const isLoading = ({ loading }) => {
  console.log(`check isLoading: ${loading}`)
  return loading;
}

const isNotFound = ({ job }) => {
  return typeof job === 'undefined';
}

const isWaiting = ({ job }) => {
  const waitingStates = ['waiting','ready']
  const isWaiting = waitingStates.indexOf(job.status) > 0;
  console.log(`check isWaiting ${isWaiting}`);
  return isWaiting;
}

const isRunning = ({ job }) => {
  const isRunning = job.status === 'running';
  console.log(`check isRunning: ${isRunning}`);
  return isRunning;
}

const isFinished = ({ job }) => {
  const isFinished = job.status === 'completed';
  console.log(`check isFinished: ${isFinished}`);
  return isFinished;
}

const noHits = ({ job }) => {
  const hits = job.result.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
  return typeof hits === 'undefined'
}

/**
 * Meteor reactive data tracker to fetch blast job results based on url
 * @function blastDataTracker
 * @param  {Object} props input props passed to React component
 * @return {Object}       Modified props based on Meteor reactive data
 */
const blastDataTracker = () => {
  const subscription = Meteor.subscribe('jobQueue');
  const jobId = FlowRouter.getParam('_id')
  return {
    loading: !subscription.ready(),
    job: jobQueue.findOne({_id: jobId})
  }
}

const withConditionalRendering = compose(
  withTracker(blastDataTracker),
  withEither(isNotFound, NotFound),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running),
  withEither(noHits, NoHits)
)

/**
 * @module ui
 * @submodule blast
 * @class BlastResult
 * @constructor
 * @extends { React.Component }
 */
class BlastResult extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { job, ...props } = this.props;
    return (
      <div className="container py-2">
        <div className='card'>
          <div className='card-header'>
            <b>Blast results</b> <small> Job ID: {job._id}</small>
          </div>
          <BlastResultPlot blastResult = {job.result} queryLength = {job.data.input.length}/>
          <BlastResultList blastResult = {job.result} />
        </div>
      </div>
    )
  }
}

export default withConditionalRendering(BlastResult)