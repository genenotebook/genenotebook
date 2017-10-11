import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import BlastResultPlot from './BlastResultPlot.jsx';
import BlastResultList from './BlastResultList.jsx';

import './blastResult.scss';

/**
 * https://www.robinwieruch.de/gentle-introduction-higher-order-components/
 * @param  {[type]}   conditionalRenderingFn [description]
 * @param  {Function} EitherComponent)       [description]
 * @return {[type]}                          [description]
 */
const withEither = (conditionalRenderingFn, EitherComponent) => (Component) => (props) =>
  conditionalRenderingFn(props)
    ? <EitherComponent />
    : <Component { ...props } />

const Loading = () => {
  return (
    <div> 
      <p> Loading...</p>
    </div>
  )
}

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

const isLoading = (props) => {
  console.log(`check isLoading: ${props.loading}`)
  return props.loading;
}

const isWaiting = (props) => {
  const isWaiting = props.job.status === 'waiting';
  console.log(`check isWaiting ${isWaiting}`);
  return isWaiting;
}

const isRunning = (props) => {
  const isRunning = props.job.status === 'running';
  console.log(`check isRunning: ${isRunning}`);
  return isRunning;
}

const isFinished = (props) => {
  const isFinished = props.job.status === 'finished';
  console.log(`check isFinished: ${isFinished}`);
  return isFinished;
}

const withConditionalRendering = compose(
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running)
)

class BlastResult extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    console.log(this.state)
    console.log(this.props.job)
    return (
      <div>
        <BlastResultPlot blastResult = {this.props.job.result} />
        <BlastResultList blastResult = {this.props.job.result} />
      </div>
    )
  }
}

export default createContainer(()=>{
  const subscription = Meteor.subscribe('jobQueue');
  const jobId = FlowRouter.getParam('_id')
  return {
    loading: !subscription.ready(),
    job: jobQueue.findOne({_id: jobId})

  }
},withConditionalRendering(BlastResult))