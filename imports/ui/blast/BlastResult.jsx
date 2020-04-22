/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/forbid-prop-types, jsx-a11y/label-has-associated-control,
 jsx-a11y/label-has-for */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose, branch, renderComponent } from 'recompose';
import { Link } from 'react-router-dom';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
// import logger from '/imports/api/util/logger.js';

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

const MAIN_VIZ = {
  'HSP plot': BlastResultPlot,
  'Job info': BlastJobInfo,
};

const HIT_INFO = {
  'BLAST Alignment': BlastAlignment,
  Expression: GeneExpression,
  'Protein domains': ProteinDomains,
};

function JobStatus({ children }) {
  return (
    <section className="hero is-medium is-light">
      <div className="hero-body">
        <div className="container">
          {children}
        </div>
      </div>
    </section>
  );
}

JobStatus.propTypes = {
  children: PropTypes.object.isRequired,
};

function Loading({ jobId }) {
  return (
    <JobStatus>
      <>
        <h1 className="title">
          Loading job info ...
        </h1>
        <h2>
          BLAST Job
          <code>
            { jobId }
          </code>
        </h2>
        <progress className="progress is-dark" max="100" />
      </>
    </JobStatus>
  );
}

Loading.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function Waiting({ jobId }) {
  return (
    <JobStatus>
      <>
        <h1 className="title">
          Waiting ...
        </h1>
        <h2 className="subtitle">
          Job
          <code>
            {` ${jobId} `}
          </code>
          is in the queue
        </h2>
        <progress className="progress is-dark" max="100" />
      </>
    </JobStatus>
  );
}

Waiting.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function Running({ jobId }) {
  return (
    <JobStatus>
      <>
        <h1 className="title">
          Running ...
        </h1>
        <h2 className="subtitle">
          Job
          <code>
            {` ${jobId} `}
          </code>
          is in progress
        </h2>
        <progress className="progress is-info" max="100" />
      </>
    </JobStatus>
  );
}

Running.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function NotFound({ jobId }) {
  return (
    <JobStatus>
      <>
        <h1 className="title">
          Not found
        </h1>
        <h2 className="subtitle">
          Job&nbsp;
          <code>{jobId}</code>
        &nbsp;not found
        </h2>
      </>
    </JobStatus>
  );
}

NotFound.propTypes = {
  jobId: PropTypes.string.isRequired,
};

function NoHits({ job }) {
  return (
    <JobStatus>
      <>
        <h1 className="title">
          No BLAST hits found
        </h1>
        <BlastJobInfo job={job} />
      </>
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

function BlastResult({ job }) {
  const [mainVizSelection, setMainViz] = useState(Object.keys(MAIN_VIZ)[0]);
  const MainViz = MAIN_VIZ[mainVizSelection];
  const [hitInfo, setHitInfo] = useState(Object.keys(HIT_INFO)[0]);
  const { result, _id: jobId } = job;
  const { hits } = result;
  return (
    <div className="container blast-result">
      <div className="card">
        <header className="has-background-light">
          <div className="level">
            <h4 className="title is-size-4 has-text-weight-light level-left">
              BLAST results
            </h4>
            <div className="field is-grouped is-grouped-multiline level-item">
              <span className="tags has-addons">
                <span className="tag">№ hits</span>
                <span className="tag is-info">{ hits.length }</span>
              </span>
              <span className="tags has-addons">
                <span className="tag">Job ID</span>
                <span className="tag is-link">
                  <Link
                    className="has-text-white"
                    to={`/genes/?blastJob=${job._id}`}
                  >
                    {job._id}
                  </Link>
                </span>
              </span>
              <span className="tags has-addons">
                <span className="tag">Created</span>
                <span className="tag is-dark">
                  {job.created.toDateString()}
                </span>
              </span>
            </div>
            <div className="dropdown is-hoverable is-right level-right">
              <div className="dropdown-trigger">
                <button type="button" className="button is-small">
                  <span className="icon-cog" />
                  {' Options'}
                </button>
              </div>
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-content">
                  {/* Main plot options */}
                  <h6 className="dropdown-header">Plot:</h6>
                  {Object.keys(MAIN_VIZ).map((option) => {
                    const checked = option === mainVizSelection;
                    return (
                      <div key={`${option}-${String(checked)}`} className="dropdown-item">
                        <label className="radio">
                          <input
                            type="radio"
                            className="radio"
                            id={option}
                            checked={checked}
                            onChange={() => {
                              setMainViz(option);
                            }}
                          />
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
                      <div key={`${option}-${String(checked)}`} className="dropdown-item">
                        <label className="radio">
                          <input
                            type="radio"
                            className="radio"
                            id={option}
                            checked={checked}
                            onChange={() => {
                              setHitInfo(option);
                            }}
                          />
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
                    {' Show in GeneTable'}
                  </Link>
                  <div className="dropdown-divider" />
                  <Link
                    to={`/genes/?blastJob=${jobId}`}
                    className="dropdown-item featuremenu-item is-static"
                    style={{ pointerEvents: 'none' }}
                  >
                    <span className="icon-floppy" />
                    {' Save results'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="card-content">
          <MainViz job={job} />
        </div>
        <div className="card-content">
          <BlastResultList
            blastResult={job.result}
            RenderComponent={HIT_INFO[hitInfo]}
          />
        </div>
      </div>
    </div>
  );
}

BlastResult.propTypes = {
  job: PropTypes.object.isRequired,
};

export default compose(
  withTracker(blastDataTracker),
  branch(isLoading, renderComponent(Loading)),
  branch(isNotFound, renderComponent(NotFound)),
  branch(isWaiting, renderComponent(Waiting)),
  branch(isRunning, renderComponent(Running)),
  branch(noHits, renderComponent(NoHits)),
)(BlastResult);
