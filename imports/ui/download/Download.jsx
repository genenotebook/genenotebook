/* eslint-disable react/forbid-prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import serverRouterClient from '/imports/startup/client/download-routes.js';

function JobStatus({ children }) {
  return (
    <div className="container py-2">
      <div className="alert alert-light border py-5">{children}</div>
    </div>
  );
}

JobStatus.propTypes = {
  children: PropTypes.object.isRequired,
};

function Waiting({ job }) {
  const percent = Math.round(job.progress.percent);
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center"> Searching files...</h2>
        <div className="progress">
          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: `${percent}%` }}
              aria-valuenow={percent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </React.Fragment>
    </JobStatus>
  );
}

Waiting.propTypes = {
  job: PropTypes.object.isRequired,
};

function Running({ job }) {
  const percent = Math.round(job.progress.percent);
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center"> Compressing files...</h2>
        <div className="progress">
          <div className="progress">
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${percent}%` }}
              aria-valuenow={percent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </React.Fragment>
    </JobStatus>
  );
}

Running.propTypes = {
  job: PropTypes.object.isRequired,
};

function JobNotFound() {
  return (
    <JobStatus>
      <h2 className="text-center">Job not found</h2>
    </JobStatus>
  );
}

function isWaiting({ job }) {
  const waitingStates = ['waiting', 'ready'];
  return waitingStates.indexOf(job.status) > 0;
}

function isRunning({ job }) {
  return job.status === 'running';
}

function jobNotFound({ job }) {
  return typeof job === 'undefined';
}

function downloadDataTracker({ match }) {
  const { downloadId } = match.params;
  const jobSub = Meteor.subscribe('jobQueue');
  const loading = !jobSub.ready();
  const job = jobQueue.findOne({
    type: 'download',
    'data.queryHash': downloadId,
  });
  return {
    loading,
    job,
  };
}

const withConditionalRendering = compose(
  withTracker(downloadDataTracker),
  withEither(jobNotFound, JobNotFound),
  withEither(isLoading, Loading),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running),
);

function Download({ job }) {
  const fileName = job.result.value;

  serverRouterClient.redirect.download(fileName);

  return <div>Job is ready, should begin download</div>;
}

Download.propTypes = {
  job: PropTypes.object.isRequired,
};

export default withConditionalRendering(Download);
