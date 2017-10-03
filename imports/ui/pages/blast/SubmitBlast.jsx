import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import update from 'immutability-helper';

import { Tracks } from '/imports/api/genomes/track_collection.js';

function determineSeqType(seq){
  const dna = 'cgatCGAT'
  let fractionDna = 0
  let i = dna.length
  while (i--){
    let nuc = dna[i]
    fractionDna += (seq.split(nuc).length - 1) / seq.length
  }
  const seqType = fractionDna >= 0.9 ? 'Nucleotide' : 'Protein'
  return seqType
}

const SequenceInput = (props) => {
  return (
    <div>
      <textarea 
        className="form-control" 
        rows="10" 
        id="blast_seq" 
        type="text" 
        placeholder="Enter sequence" 
        value={props.value}
        onChange={props.enterSequence}
      />
      {
        props.value &&
        <div className="btn-group">
          <button type="button" className="btn btn-default disabled">This is a</button>
          <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
          <strong>{props.seqType}</strong> sequence
          <span className="caret"></span>
          </button>
          <ul className="dropdown-menu">
            <li>
              <a className="seq-select" id="Protein" onClick={props.selectSeqType} >
                Protein sequence
              </a>
            </li>
            <li>
              <a className="seq-select" id="Nucleotide" onClick={props.selectSeqType} >
                Nucleotide sequence
              </a>
            </li>
          </ul>
        </div>
      }
    </div>
  )
}

const TrackSelect = (props) => {
  console.log(props.selectedTracks)
  return (
    <div>
      <label> Select tracks: </label>
        {
          props.tracks.map(track => {
            return (
              <div className="checkbox track-select" key={track.trackName}>
                <input 
                  type="checkbox" 
                  className="track-checkbox" 
                  id={ track.trackName } 
                  name="track-checkbox"
                  checked={props.selectedTracks.indexOf(track.trackName) >= 0}
                  onChange={props.toggleTrackSelect} 
                />
                <label htmlFor={ track.trackName }>{ track.trackName }</label>
              </div>
            )
            /*<input
              name={track.trackName}
              key={track.trackName}
              type='checkbox'
              checked={props.selectedTracks.indexOf(track.trackName) > 0}
              onChange={props.toggleTrackSelect}
            />*/
          })
        }
    </div>
  )
}

class SubmitBlast extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      input: undefined,
      seqType: undefined,
      selectedTracks: []
    }
  }

  enterSequence = event => {
    event.preventDefault();
    const input = event.target.value;
    const seqType = input ? determineSeqType(input): undefined;
    this.setState({
      input: input,
      seqType: seqType
    })
  }

  selectSeqType = event => {
    event.preventDefault();
    const seqType = event.target.id;
    this.setState({
      seqType: seqType
    })
  }

  toggleTrackSelect = event => {
    event.preventDefault();
    const trackName = event.target.id;
    const index = this.state.selectedTracks.indexOf(trackName);
    console.log(index,trackName)
    let newState;
    if (index == -1){
      newState = update(this.state, {
        selectedTracks: {
          $push: [trackName]
        }
      })
    } else {
      newState = update(this.state, {
        selectedTracks: {
          $splice: [[index]]
        }
      })
    }
    console.log(newState)
    this.setState(newState)
  }

  render(){
    console.log(this.props)
    return (
      this.props.loading ? 
      <div>LOADING</div> :
      <form role="form" id="blast">
        <div className="panel panel-default">
          <div className="panel-heading">Blast search</div>
            <div className="panel-body">
              <SequenceInput 
                value = {this.state.input}
                seqType = {this.state.seqType}
                enterSequence = {this.enterSequence}
                selectSeqType = {this.selectSeqType}
              />
            </div>
        <ul className="list-group">
          <li className="list-group-item">
            <TrackSelect 
              tracks = {this.props.tracks}
              selectedTracks = {this.state.selectedTracks}
              toggleTrackSelect={this.toggleTrackSelect}
            />
          </li>
          <li className="list-group-item">
            Advanced options ...
          </li>
        </ul>
        <div className="panel-footer">
            <div className="row">
              <label className="col-md-4">Search a ...</label>
              <div className="col-md-6 btn-group">
              {/*
                {{#if input}}
                  {{#if anyTrack}}
                    <div class="btn-group">
                      <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                        <strong>{{dbtype}}</strong> database
                        <span class="caret"></span>
                      </button>
                      <ul class="dropdown-menu">
                        {{#each dbtypes}}
                          <li><a href="#" class="db-select" id="{{this}}">{{this}} database</a></li>
                        {{/each}}
                      </ul>
                    </div>
                    <div class="btn-group">
                      <button type="button" class="btn btn-primary" id="submit-blast">
                        <span class="glyphicon glyphicon-search"></span>
                        {{blasttype}}
                      </button>
                    </div>
                  {{else}}
                    <button type="button" class="btn disabled">
                    <span class="glyphicon glyphicon-question-sign"></span> Select a track
                    </button>
                  {{/if}}
                {{else}}
                  <button type="button" class="btn disabled">
                  <span class="glyphicon glyphicon-question-sign"></span> Enter sequence
                  </button>
                {{/if}}
              */}
              </div>
            </div>
          </div>
        </div>
      </form>
    )
  }
}

export default createContainer(()=>{
  const subscription = Meteor.subscribe('tracks');
  return {
    loading: !subscription.ready(),
    tracks: Tracks.find({}).fetch()
  }
},SubmitBlast)