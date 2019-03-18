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


class HasBlastDb extends React.Component {
  removeBlastDb = event => {
    const genomeId = event.target.id;
    logger.log('Click remove blastdb ' + genomeId)
    removeBlastDb.call({ genomeId } , (err,res) => {
      if (err){
        logger.warn(err)
        alert(err)
      }
    })
  }
  render(){
    const { isEditing, genomeId } = this.props;
    return (
      isEditing ? 
      <button type="button" className="btn btn-outline-danger btn-sm px-2 py-0 btn-block" id={genomeId} onClick={this.removeBlastDb}>
        <span className="icon-exclamation" /> Remove Blast DBs
      </button> :
      <button type="button" className="btn btn-outline-success btn-sm px-2 py-0 btn-block" id={genomeId} disabled>
        <span className="icon-check" />  Blast DBs present
      </button> 
    )
  }
}

const HasJob = ({ job }) => {
  return (
    'Job status'
  )
}

class HasNoJob extends React.Component {
  makeBlastDb = event => {
    const genomeId = event.target.id;
    makeBlastDb.call({ genomeId }, (err,res) => {
      if ( err ){
        logger.warn(err)
        alert(err)
      }
    })
  }
  render(){
    const { isEditing, genomeId } = this.props;
    return (
      isEditing ?
      <button type="button" className="btn btn-outline-primary btn-sm px-2 py-0 btn-block" 
        id={genomeId} onClick={this.makeBlastDb}>
        Make Blast DB
      </button> :
      <button type="button" className="btn btn-outline-secondary btn-sm px-2 py-0 btn-block" 
        id={genomeId} disabled>
        <i className="icon-block" />  No Blast DB
      </button> 
    )
  }
}

const makeBlastDbJobTracker = ({ genomeId, isEditing }) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({ 'data.genomeId': genomeId, status: {$ne: 'completed'} });
  logger.log(job)
  const hasJob = typeof job !== 'undefined' && job.status !== 'completed';
  return {
    job,
    hasJob,
    loading,
    genomeId, 
    isEditing
  }
}

const HasNoBlastDb = ({ hasJob, job, genomeId, isEditing }) => {
  return (
    hasJob ?
    <JobProgressBar {...job} /> :
    <HasNoJob isEditing={isEditing} genomeId={genomeId} />
  )
}

const HasNoBlastDbWithJobTracker = compose(
  withTracker(makeBlastDbJobTracker),
  withEither(isLoading, Loading)
)(HasNoBlastDb);

export const BlastDB = ({ isEditing, genomeId, blastDb, ...props }) => {
  const hasBlastDb = typeof blastDb !== 'undefined';
  return (
    hasBlastDb ?
    <HasBlastDb genomeId={genomeId} isEditing={isEditing} /> :
    <HasNoBlastDbWithJobTracker genomeId={genomeId} isEditing={isEditing} />
  )
}

