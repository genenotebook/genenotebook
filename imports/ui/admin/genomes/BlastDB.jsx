/* eslint-disable react/prop-types */
/* eslint-disable react/no-multi-comp */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import makeBlastDb from '/imports/api/blast/makeblastdb.js';
import removeBlastDb from '/imports/api/blast/removeblastdb.js';
import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import logger from '/imports/api/util/logger.js';

import { JobProgressBar } from '/imports/ui/admin/jobqueue/AdminJobqueue.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

function HasBlastDb({ isEditing, genomeId }) {
  return isEditing ? (
    <button
      type="button"
      className="btn btn-outline-danger btn-sm px-2 py-0 btn-block"
      id={genomeId}
      onClick={() => {
        removeBlastDb.call({ genomeId }, (err) => {
          if (err) {
            logger.warn(err);
            alert(err);
          }
        });
      }}
    >
      <span className="icon-exclamation" />
      Remove Blast DBs
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-outline-success btn-sm px-2 py-0 btn-block"
      id={genomeId}
      disabled
    >
      <span className="icon-check" />
      Blast DBs present
    </button>
  );
}

function HasNoJob({ isEditing, genomeId }) {
  return isEditing ? (
    <button
      type="button"
      className="btn btn-outline-primary btn-sm px-2 py-0 btn-block"
      id={genomeId}
      onClick={() => {
        makeBlastDb.call({ genomeId }, (err) => {
          if (err) {
            logger.warn(err);
            alert(err);
          }
        });
      }}
    >
      Make Blast DB
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm px-2 py-0 btn-block"
      id={genomeId}
      disabled
    >
      <i className="icon-block" />
      No Blast DB
    </button>
  );
}

const makeBlastDbJobTracker = ({ genomeId, isEditing }) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({
    'data.genomeId': genomeId,
    status: { $ne: 'completed' },
  });
  logger.log(job);
  const hasJob = typeof job !== 'undefined' && job.status !== 'completed';
  return {
    job,
    hasJob,
    loading,
    genomeId,
    isEditing,
  };
};

function HasNoBlastDb({ hasJob, job, ...props }) {
  return hasJob ? <JobProgressBar {...job} /> : <HasNoJob {...props} />;
}

const HasNoBlastDbWithJobTracker = compose(
  withTracker(makeBlastDbJobTracker),
  withEither(isLoading, Loading),
)(HasNoBlastDb);

export default function BlastDB({ isEditing, genomeId, blastDb }) {
  const hasBlastDb = typeof blastDb !== 'undefined';
  return hasBlastDb ? (
    <HasBlastDb genomeId={genomeId} isEditing={isEditing} />
  ) : (
    <HasNoBlastDbWithJobTracker genomeId={genomeId} isEditing={isEditing} />
  );
}
