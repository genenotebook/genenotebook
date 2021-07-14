/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { formatDate } from '/imports/ui/util/uiUtil.jsx';

const REMOVE_STATES = ['completed', 'failed', 'cancelled'];
// const RESTART_STATES = ['failed', 'cancelled'];
const CANCEL_STATES = ['waiting', 'running', 'created', 'ready']; // Anything that is not completed, failed or cancelled

function Status({ status }) {
  let labelClass = 'tag ';
  switch (status) {
    case 'completed':
      labelClass += 'is-success';
      break;
    case 'cancelled':
      labelClass += 'is-warning';
      break;
    case 'failed':
      labelClass += 'is-danger';
      break;
    case 'running':
      labelClass += 'is-primary';
      break;
    default:
      break;
      // labelClass += 'is-light';
  }
  return (
    <span className={labelClass}>
      {` ${status} `}
    </span>
  );
}

export function JobProgressBar({ progress, loading, status }) {
  if (loading) {
    return null;
  }

  const { completed, total, percent } = progress;
  let barColor = '';
  switch (true) {
    case (completed === 0):
      barColor = 'is-default';
      break;
    case (completed < total):
      barColor = 'is-info';
      break;
    case (completed === total):
      barColor = 'is-success';
      break;
    default:
      break;
  }
  const value = completed === 0 && status !== 'cancelled'
    ? null
    : Math.round(percent);
  return (
    <progress
      className={`progress is-small ${barColor}`}
      value={value}
      max="100"
    >
      {`${value}%`}
    </progress>
  );
  /*
  return (
    <div className="progress">
      <div
        className={`progress-bar bg-${barColor}`}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin="0"
        aria-valuemax="100"
        style={{ width: `${percent}%` }}
      >
        {`${Math.round(percent)}%`}
      </div>
    </div>
  );
  */
}

function performJobAction(jobId, action) {
  jobQueue.getJob(jobId, (err, job) => {
    job[action]();
  });
}

function JobInfo({ job, loading }) {
  const { _id: jobId } = job;
  return (
    <tr key={jobId}>
      <td><Status {...job} /></td>
      <td><code>{job._id}</code></td>
      <td>{job.type}</td>
      <td>{formatDate(job.created)}</td>
      <td>{job.data.userId}</td>
      <td><JobProgressBar loading={loading} {...job} /></td>
      <td>
        <div className="buttons has-addons">
          <button
            type="button"
            className="button is-small"
            onClick={() => {
              performJobAction(jobId, 'rerun');
            }}
          >
            Rerun
          </button>
          {
            CANCEL_STATES.indexOf(job.status) >= 0
            && (
            <button
              type="button"
              className="button is-small is-warning is-outlined"
              onClick={() => {
                performJobAction(jobId, 'cancel');
              }}
            >
              Cancel
            </button>
            )
          }
          {
            REMOVE_STATES.indexOf(job.status) >= 0
            && (
            <button
              type="button"
              className="button is-small is-danger is-light is-outlined"
              onClick={() => {
                performJobAction(jobId, 'remove');
              }}
            >
              Remove
            </button>
            )
          }
        </div>
      </td>
    </tr>
  );
}

function AdminJobqueue({ loading, jobs }) {
  return loading
    ? <div> Loading </div>
    : (
      <table className="table is-hover is-small is-fullwidth">
        <thead>
          <tr>
            {
              [
                'Status', 'ID', 'Type', 'Created', 'User', 'Progress', 'Actions',
              ].map((label) => (
                <th key={label} scope="col">
                  <button
                    type="button"
                    className="button is-small is-static is-fullwidth"
                  >
                    { label }
                  </button>
                </th>
              ))
            }
          </tr>
        </thead>
        <tbody>
          {
            jobs.map((job) => (
              <JobInfo key={job._id} job={job} loading={loading} />
            ))
          }
        </tbody>
      </table>
    );
}

export default withTracker(() => {
  const subscription = Meteor.subscribe('jobQueue');
  return {
    jobs: jobQueue.find({}).fetch(),
    loading: !subscription.ready(),
  };
})(AdminJobqueue);
