import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';
import { removeBlastDb } from '/imports/api/blast/removeblastdb.js';
import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';


class HasBlastDb extends React.Component {
  removeBlastDb = event => {
    const trackId = event.target.name;
    removeBlastDb.call({ trackId })
  }
  render(){
    const { isEditing, trackId } = this.props;
    return (
      isEditing ? 
      <button type="button" className="btn btn-danger px-2 py-0" name={trackId} onClick={this.removeBlastDb}>
        <i className="fa fa-exclamation" /> Delete
      </button> :
      <span className="badge badge-success"><i className="fa fa-check" /> Present</span>
    )
  }
}

const HasJob = () => {
  return (
    'Job status'
  )
}

class HasNoJob extends React.Component {
  makeBlastDb = event => {
    const trackId = event.target.name;
    makeBlastDb.call({ trackId }, (err,res) => {
      if ( err ){
        console.log(err)
        alert(err)
      }
    })
  }
  render(){
    const { isEditing, trackId } = this.props;
    return (
      isEditing ?
      <button type="button" className="btn btn-outline-success btn-sm px-2 py-0" name={trackId} onClick={this.makeBlastDb}>
        <i className="fa fa-exclamation" /> Make Blast DB
      </button> :
      <button type="button" className="btn btn-outline-secondary btn-sm px-2 py-0" name={trackId} disabled>
        <i className="fa fa-ban" />  Absent
      </button> 
    )
  }
}

const makeBlastDbJobTracker = ({ trackId, isEditing }) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({ 'data.trackId': trackId });
  const hasJob = typeof job !== 'undefined' && job.status !== 'completed';
  return {
    job,
    hasJob,
    loading,
    trackId, 
    isEditing
  }
}

const HasNoBlastDb = ({ hasJob, job, trackId, isEditing }) => {
  console.log(hasJob, job)
  return (
    hasJob ?
    <HasJob /> :
    <HasNoJob isEditing={isEditing} trackId={trackId} />
  )
}

const HasNoBlastDbWithJobTracker = compose(
  withTracker(makeBlastDbJobTracker),
  withEither(isLoading, Loading)
)(HasNoBlastDb);

export const BlastDB = ({ trackId, blastdbs, isEditing }) => {
  const hasBlastDb = typeof blastdbs !== 'undefined';
  return (
    hasBlastDb ?
    <HasBlastDb trackId={trackId} isEditing={isEditing} /> :
    <HasNoBlastDbWithJobTracker trackId={trackId} isEditing={isEditing} />
  )
}

/*
Should check three conditions:
isEditing, hasBlastDb, jobIsRunning
 */