import React from 'react';
import { compose } from 'recompose';

import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';
import { removeBlastDb } from '/imports/api/blast/removeblastdb.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';


class HasBlastDb extends React.Component {
  removeBlastDb = event => {
    const trackId = event.target.name;
    removeBlastDb.call({ trackId })
  }
  render(){
    const { isEditing, trackId } = this.props;
    return (
      isEditing ? 
      <button type="button" className="btn btn-danger px-2 py-0" name={trackId} onCLick={this.removeBlastDb}>
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
  }
  render(){
    const { isEditing, trackId } = this.props;
    return (
      isEditing ?
      <button type="button" className="btn btn-danger px-2 py-0" name={trackId} onCLick={this.removeBlastDb}>
        <i className="fa fa-exclamation" /> Delete
      </button> :
      <span className="badge badge-secondary"><i className="fa fa-ban" /> Absent</span> 
    )
  }
}

const HasNoBlastDb = ({ hasJob, job, trackId, isEditing }) => {
  return (
    hasJob ?
    <HasJob /> :
    <HasNoJob isEditing={isEditing} trackId={trackId} />
  )
}

export const BlastDB = ({ trackId, blastdbs, isEditing }) => {
  const hasBlastDb = typeof blastdbs !== 'undefined';
  return (
    hasBlastDb ?
    <HasBlastDb trackId={trackId} isEditing={isEditing} /> :
    <HasNoBlastDb trackId={trackId} isEditing={isEditing} />
  )
}

/*
Should check three conditions:
isEditing, hasBlastDb, jobIsRunning
 */