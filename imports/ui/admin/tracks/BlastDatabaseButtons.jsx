import React from 'react';

import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';
import { removeBlastDb } from '/imports/api/blast/removeblastdb.js';

import BlastDatabaseProgressBar from './BlastDatabaseProgressBar.jsx';

class MakeDbButton extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      makeBlastDbJob: undefined
    }
  }

  makeBlastDb = () => {
    makeBlastDb.call({
      trackName: this.props.track.trackName
    },(err,res) => {
      if(err){
        console.log(err)
        alert(err)
      }
      console.log(res)
      this.setState({
        makeBlastDbJob: res
      })
    })
  }

  render(){
    return (
      this.state.makeBlastDbJob ?
      <BlastDatabaseProgressBar jobId={this.state.makeBlastDbJob} /> :
      <button 
        type = 'button' 
        className = 'btn btn-sm btn-outline-secondary makeblastdb pull-right'
        onClick = {this.makeBlastDb}>
        <span className = 'glyphicon glyphicon-hdd' aria-hidden = 'true' />
        &nbsp;Make blast DBs
      </button>
    )
  }
}

class RemoveDbButton extends React.Component {
  constructor(props){
    super(props)
  }

  removeBlastDb = () => {
    removeBlastDb.call({
      trackName: this.props.track.trackName
    }, (err,res) => {
      if (err){
        console.log(err)
        alert(err)
      } 
      if(res){
        console.log(res)
      }
    })
  }

  render(){
    return (
      <button 
        type = 'button' 
        className = 'btn btn-sm btn-danger makeblastdb pull-right'
        onClick = {this.removeBlastDb}>
        <span className = 'glyphicon glyphicon-remove' aria-hidden = 'true' />
        &nbsp;Delete blast DBs
      </button>
    )
  }
}

const BlastDatabaseButtons = ({ track }) => {
  return track.hasOwnProperty('blastdbs') ?
    <RemoveDbButton track={track} /> :
    <MakeDbButton track={track} />
}

export default BlastDatabaseButtons
