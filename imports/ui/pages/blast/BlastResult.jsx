import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

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

const Loading = () => 
  <div> 
    <p> Loading...</p>
  </div>

const Waiting = () => 
  <div>
    <p> Waiting...</p>
  </div>

const Running = () => 
  <div>
    <p> Running... </p>
  </div>

const isLoading = (props) => props.loading;

const isWaiting = (props) => props.job.status === 'waiting';

const isRunning = (props) => props.job.status === 'running';

const isFinished = (props) => props.job.status === 'finished';

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
        JOB READY
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