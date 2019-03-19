import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { Link } from 'react-router-dom';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import logger from '/imports/api/util/logger.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import BlastResultPlot from './BlastResultPlot.jsx';
import BlastResultList from './BlastResultList.jsx';

import './blastResult.scss';

const Loading = () => (
  <div>
    <p> Loading job info...</p>
  </div>
);

const Waiting = () => (
  <div>
    <p> Waiting for job to start...</p>
  </div>
);

const Running = () => (
  <div>
    <p> Job is running... </p>
  </div>
);

const NotFound = () => (
  <div>
    <p> Job not found </p>
  </div>
);

const NoHits = () => (
  <div>
    <p> No BLAST hits found </p>
  </div>
);

const isLoading = ({ loading }) => {
  logger.debug(`check isLoading: ${loading}`);
  return loading;
};

const isNotFound = ({ job }) => typeof job === 'undefined';

const isWaiting = ({ job }) => {
  const waitingStates = ['waiting', 'ready'];
  const isWaiting = waitingStates.indexOf(job.status) > 0;
  logger.debug(`check isWaiting ${isWaiting}`);
  return isWaiting;
};

const isRunning = ({ job }) => {
  const isRunning = job.status === 'running';
  logger.debug(`check isRunning: ${isRunning}`);
  return isRunning;
};

const noHits = ({ job }) => {
  const hits =    job.result.BlastOutput.BlastOutput_iterations[0].Iteration[0]
      .Iteration_hits[0].Hit;
  return typeof hits === 'undefined';
};

/**
 * Meteor reactive data tracker to fetch blast job results based on url
 * @function blastDataTracker
 * @param  {Object} props input props passed to React component
 * @return {Object}       Modified props based on Meteor reactive data
 */
const blastDataTracker = ({ match }) => {
  const { jobId } = match.params;
  const subscription = Meteor.subscribe('jobQueue');
  // const jobId = FlowRouter.getParam('_id')
  return {
    loading: !subscription.ready(),
    job: jobQueue.findOne({ _id: jobId }),
  };
};

const withConditionalRendering = compose(
  withTracker(blastDataTracker),
  withEither(isNotFound, NotFound),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running),
  withEither(noHits, NoHits),
);

function BlastResult({ job }) {
  return (
    <div className="container py-2">
      <div className="card">
        <div className="card-header">
          <h5>BLAST results </h5>
          For job with ID&nbsp;
          <small>
            <Link to={`/genes/?blastJob=${job._id}`}>{job._id}</Link>
          </small>
          &nbsp;Created on&nbsp;
          {job.created.toDateString()}
        </div>
        <BlastResultPlot
          blastResult={job.result}
          queryLength={job.data.input.length}
        />
        <BlastResultList blastResult={job.result} />
      </div>
    </div>
  );
}

BlastResult.propTypes = {
  job: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default withConditionalRendering(BlastResult);
