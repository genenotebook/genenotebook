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
      <p> Waiting...</p>
    </div>
  )
}

const Running = () => {
  return (
    <div>
      <p> Running... </p>
    </div>
  )
}

const isWaiting = (props) => {
  const waitingStates = ['waiting','ready']
  const isWaiting = waitingStates.indexOf(props.job.status) > 0;//props.job.status === 'waiting';
  console.log(`check isWaiting ${isWaiting}`);
  return isWaiting;
}

const isRunning = (props) => {
  const isRunning = props.job.status === 'running';
  console.log(`check isRunning: ${isRunning}`);
  return isRunning;
}

const isFinished = (props) => {
  const isFinished = props.job.status === 'completed';
  console.log(`check isFinished: ${isFinished}`);
  return isFinished;
}

const downloadDataTracker = () => {
  const queryHash = FlowRouter.getParam('_id');
  console.log(jobQueue.findOne({ 'data.queryHash': queryHash }))
  const jobSub = Meteor.subscribe('jobQueue');
  return {
    loading: !jobSub.ready(),
    job: jobQueue.findOne({ 'data.queryHash': queryHash })
  }
}

const withConditionalRendering = compose(
  withTracker(downloadDataTracker),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running)
)

class Download extends React.Component {
  constructor(props){
    super(props)
    console.log(props)
  }

  render(){
    const { job } = this.props;
    const fileName = job.result.value;
    /*
    const downloadUrl = Meteor.absoluteUrl(`download/file/${fileName}`);
    console.log(downloadUrl)
    window.open(downloadUrl, '', '', true)
    */
    serverRouterClient.redirect.download(fileName)
    return (
      <div>Job is ready, should begin download</div>
    )
  }
}

export default withConditionalRendering(Download)

/*
export default withTracker(props => {
  const queryHash = FlowRouter.getParam('_id');
  //const downloadSub = Meteor.subscribe('downloads', downloadId)
  console.log(jobQueue.findOne({ 'data.queryHash': queryHash }))
  const jobSub = Meteor.subscribe('jobQueue');
  return {
    loading: !jobSub.ready(),
    job: jobQueue.findOne({ 'data.queryHash': queryHash })
  }
})(withConditionalRendering(Download));
*/