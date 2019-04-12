/* eslint-disable react/forbid-prop-types, jsx-a11y/label-has-associated-control,
 jsx-a11y/label-has-for */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { Link } from 'react-router-dom';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
// import logger from '/imports/api/util/logger.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';
import {
  Dropdown,
  DropdownMenu,
  DropdownButton,
} from '/imports/ui/util/Dropdown.jsx';

import ProteinDomains from '/imports/ui/singleGenePage/ProteinDomains.jsx';
import GeneExpression from '/imports/ui/singleGenePage/geneExpression/GeneExpression.jsx';

import BlastResultPlot from './BlastResultPlot.jsx';
import BlastResultList from './BlastResultList.jsx';
import BlastAlignment from './BlastAlignment.jsx';
import BlastJobInfo from './BlastJobInfo.jsx';

import './blastResult.scss';

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

function Loading() {
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center"> Loading job info...</h2>
        <div className="progress">
          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </React.Fragment>
    </JobStatus>
  );
}

function Waiting({ jobId }) {
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center">
          Waiting for job&nbsp;
          {jobId}
          &nbsp;to start...
          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </h2>
      </React.Fragment>
    </JobStatus>
  );
}

Waiting.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function Running({ jobId }) {
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center">
          Job&nbsp;
          {jobId}
          &nbsp;is running...
          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: '30%' }}
              aria-valuenow="30"
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </h2>
      </React.Fragment>
    </JobStatus>
  );
}

Running.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function NotFound({ jobId }) {
  return (
    <JobStatus>
      <h2 className="text-center">
        Job&nbsp;
        {jobId}
        &nbsp;not found
      </h2>
    </JobStatus>
  );
}

NotFound.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function NoHits({ job }) {
  return (
    <JobStatus>
      <React.Fragment>
        <h2 className="text-center"> No BLAST hits found</h2>
        <BlastJobInfo job={job} />
      </React.Fragment>
    </JobStatus>
  );
}

NoHits.propTypes = {
  job: PropTypes.object.isRequired,
};

function isLoading({ loading }) {
  return loading;
}

function isNotFound({ job }) {
  return typeof job === 'undefined';
}

function isWaiting({ job }) {
  const waitingStates = ['waiting', 'ready'];
  return waitingStates.indexOf(job.status) > 0;
}

function isRunning({ job }) {
  return job.status === 'running';
}

function noHits({ job }) {
  const { result = {} } = job;
  const { hits } = result;
  return typeof hits === 'undefined';
}

/**
 * Meteor reactive data tracker to fetch blast job results based on url
 * @function blastDataTracker
 * @param  {Object} props input props passed to React component
 * @return {Object}       Modified props based on Meteor reactive data
 */
function blastDataTracker({ match }) {
  const { jobId } = match.params;
  const subscription = Meteor.subscribe('jobQueue');
  const loading = !subscription.ready();
  const job = jobQueue.findOne({ _id: jobId });
  return {
    loading,
    job,
    jobId,
  };
}

const withConditionalRendering = compose(
  withTracker(blastDataTracker),
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound),
  withEither(isWaiting, Waiting),
  withEither(isRunning, Running),
  withEither(noHits, NoHits),
);

const MAIN_VIZ = {
  'HSP plot': BlastResultPlot,
  Info: BlastJobInfo,
};

const HIT_INFO = {
  Alignment: BlastAlignment,
  Expression: GeneExpression,
  'Protein domains': ProteinDomains,
};

function BlastResultOptions({
  mainVizSelection,
  setMainViz,
  hitInfo,
  setHitInfo,
  jobId,
}) {
  return (
    <Dropdown>
      <DropdownButton className="btn btn-sm btn-outline-dark border mx-2 py-0 dropdown-toggle">
        <span className="icon-cog" />
        &nbsp;Options
      </DropdownButton>
      <DropdownMenu className="dropdown-menu-right pt-0">
        {/* Main plot options */}
        <h6 className="dropdown-header">Plot:</h6>
        {Object.keys(MAIN_VIZ).map((option) => {
          const checked = option === mainVizSelection;
          return (
            <div key={`${option}-${String(checked)}`} className="form-check">
              <input
                type="radio"
                className="form-check-input"
                id={option}
                checked={checked}
                onChange={() => {
                  setMainViz(option);
                }}
              />
              <label
                className="form-check-label"
                onClick={() => {
                  setMainViz(option);
                }}
              >
                {option}
              </label>
            </div>
          );
        })}
        {/* Visualization per hit options */}
        <h6 className="dropdown-header">Hit info:</h6>
        {Object.keys(HIT_INFO).map((option) => {
          const checked = option === hitInfo;
          return (
            <div key={`${option}-${String(checked)}`} className="form-check">
              <input
                type="radio"
                className="form-check-input"
                id={option}
                checked={checked}
                onChange={() => {
                  setHitInfo(option);
                }}
              />
              <label
                className="form-check-label"
                onClick={() => {
                  setHitInfo(option);
                }}
              >
                {option}
              </label>
            </div>
          );
        })}
        {/* Links for sending results to GeneTable and saving job */}
        <div className="dropdown-divider" />
        <Link
          to={`/genes/?blastJob=${jobId}`}
          className="btn dropdown-item featuremenu-item"
        >
          <span className="icon-list" />
          &nbsp;Show in GeneTable
        </Link>
        <div className="dropdown-divider" />
        <Link
          to={`/genes/?blastJob=${jobId}`}
          className="dropdown-item featuremenu-item disabled"
          style={{ pointerEvents: 'none' }}
        >
          <span className="icon-floppy" />
          &nbsp;Save results
        </Link>
      </DropdownMenu>
    </Dropdown>
  );
}

BlastResultOptions.propTypes = {
  mainVizSelection: PropTypes.string.isRequired,
  setMainViz: PropTypes.func.isRequired,
  hitInfo: PropTypes.string.isRequired,
  setHitInfo: PropTypes.func.isRequired,
  jobId: PropTypes.string.isRequired,
};

function BlastResult({ job }) {
  const [mainVizSelection, setMainViz] = useState(Object.keys(MAIN_VIZ)[0]);
  const MainViz = MAIN_VIZ[mainVizSelection];
  const [hitInfo, setHitInfo] = useState(Object.keys(HIT_INFO)[0]);
  const { result } = job;
  const { hits } = result;
  return (
    <div className="container py-2">
      <div className="card">
        <div className="card-header">
          <div className="float-right">
            <BlastResultOptions
              jobId={job._id}
              {...{
                mainVizSelection,
                setMainViz,
                hitInfo,
                setHitInfo,
              }}
            />
          </div>
          <h5>
            <span className="badge badge-primary align-top">{ hits.length }</span>
            &nbsp;BLAST results
          </h5>
          For job with ID&nbsp;
          <small>
            <Link to={`/genes/?blastJob=${job._id}`}>{job._id}</Link>
          </small>
          &nbsp;Created on&nbsp;
          {job.created.toDateString()}
        </div>
        <div className="px-4 pt-3">
          <MainViz job={job} />
        </div>
        <BlastResultList
          blastResult={job.result}
          RenderComponent={HIT_INFO[hitInfo]}
        />
      </div>
    </div>
  );
}

BlastResult.propTypes = {
  job: PropTypes.object.isRequired,
};

export default withConditionalRendering(BlastResult);
