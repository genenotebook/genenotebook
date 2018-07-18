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
    const genomeId = event.target.id;
    removeBlastDb.call({ genomeId })
  }
  render(){
    const { isEditing, genomeId } = this.props;
    return (
      isEditing ? 
      <button type="button" className="btn btn-danger px-2 py-0" id={genomeId} onClick={this.removeBlastDb}>
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
    const genomeId = event.target.id;
    makeBlastDb.call({ genomeId }, (err,res) => {
      if ( err ){
        console.log(err)
        alert(err)
      }
    })
  }
  render(){
    const { isEditing, genomeId } = this.props;
    return (
      isEditing ?
      <button type="button" className="btn btn-outline-success btn-sm px-2 py-0 btn-block" id={genomeId} onClick={this.makeBlastDb}>
        Make Blast DB
      </button> :
      <button type="button" className="btn btn-outline-secondary btn-sm px-2 py-0 btn-block" id={genomeId} disabled>
        <i className="fa fa-ban" />  No Blast DB
      </button> 
    )
  }
}

const makeBlastDbJobTracker = ({ genomeId, isEditing }) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({ 'data.genomeId': genomeId });
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
  console.log(hasJob, job)
  return (
    hasJob ?
    <HasJob /> :
    <HasNoJob isEditing={isEditing} genomeId={genomeId} />
  )
}

const HasNoBlastDbWithJobTracker = compose(
  withTracker(makeBlastDbJobTracker),
  withEither(isLoading, Loading)
)(HasNoBlastDb);

export const BlastDB = ({ isEditing, genomeId, annotationTrack, ...props }) => {
  console.log(props)
  const hasBlastDb = typeof annotationTrack.blastDb !== 'undefined';
  return (
    hasBlastDb ?
    <HasBlastDb genomeId={genomeId} isEditing={isEditing} /> :
    <HasNoBlastDbWithJobTracker genomeId={genomeId} isEditing={isEditing} />
  )
}

/* 
Should check three conditions:
isEditing, hasBlastDb, jobIsRunning
 */