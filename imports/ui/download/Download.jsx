import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import { serverRouterClient } from '/imports/startup/client/download-routes.js';

const Waiting = () => {
  return (
    <div>
      <p> Waiting for download job to start...</p>
    </div>
  )
}

const Running = ({ job }) => {
  const percent = Math.round(job.progress.percent);
  return (
    <div>
      <p> Running... {percent}% </p>
    </div>
  )
}

const JobNotFound = () => {
  return <div>
    <p>Job not found</p>
  </div>
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

const jobNotFound = ({ job }) => {
  return typeof job === 'undefined'
}

const downloadDataTracker = () => {
  const queryHash = FlowRouter.getParam('_id');
  const jobSub = Meteor.subscribe('jobQueue');
  const loading = !jobSub.ready();
  const job = jobQueue.findOne({
    type: 'download',
    'data.queryHash': queryHash 
  });
  return {
    loading,
    job
  }
}

const withConditionalRendering = compose(
  withTracker(downloadDataTracker),
  withEither(jobNotFound, JobNotFound),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running)
)

const Download = ({ job }) => {
  const fileName = job.result.value;

  serverRouterClient.redirect.download(fileName)
  
  return (
    <div>Job is ready, should begin download</div>
  )
}


export default withConditionalRendering(Download)
