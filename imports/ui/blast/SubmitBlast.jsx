import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import Select from 'react-select';
import { cloneDeep } from 'lodash';
//import update from 'immutability-helper';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import { submitBlastJob } from '/imports/api/blast/submitblastjob.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import './submitblast.scss';


/**
 * Function to determine whether a given sequence string is DNA or protein
 * @param  {String} seq Input sequence, unknown if DNA or protein
 * @return {String}     Either 'Nucleotide' or 'Protein'
 */
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

/**
 * Textarea input field to input sequences for blasting
 * @param  {Object} props [description]
 * @return {SequenceInput}       [description]
 */
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
        <div className="btn-group pull-right">
          <button type="button" className="btn btn-outline-secondary btn-sm disabled">This is a</button>
          <Dropdown>
            <DropdownButton className="btn btn-secondary btn-sm dropdown-toggle">
              <strong>{props.seqType}</strong> sequence
            </DropdownButton>
            <DropdownMenu>
              <a className="dropdown-item" id="Protein" onClick={props.selectSeqType} >
                Protein sequence
              </a>
              <a className="dropdown-item" id="Nucleotide" onClick={props.selectSeqType} >
                Nucleotide sequence
              </a>
            </DropdownMenu>
          </Dropdown>
        </div>
      }
    </div>
  )
}

const GenomeSelect = ({ genomes, selectedGenomes, toggleGenomeSelect }) => {
  return (
    <div>
      <label> Select genomes: </label>
        {
          genomes.map(genome => {
            const { _id: genomeId, name } = genome;
            return (
              <div className="form-check" key={genomeId}>
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id={ genomeId } 
                  checked={selectedGenomes.has(genomeId)}
                  onChange={toggleGenomeSelect} 
                />
                <label className="form-check-label" htmlFor={ name }>{ name }</label>
              </div>
            )
          })
        }
    </div>
  )
}

const SubmitButtons = (props) => {
  return (
    <div className='btn-group'>
      <div className="btn-group">
        <Dropdown>
          <DropdownButton className="btn btn-outline-primary dropdown-toggle">
            <strong>{props.selectedDbType}</strong> database
          </DropdownButton>
          <DropdownMenu>
            {
              props.dbTypes.map(dbType => {
                return (
                    <a key={dbType} className="dropdown-item db-select" id={dbType} onClick={props.selectDbType}>
                      {dbType} database
                    </a>
                )
              })
            }
          </DropdownMenu>
        </Dropdown>
      </div>
      <div className='btn-group'>
        <button 
          type="button" 
          className="btn btn-primary" 
          id="submit-blast"
          onClick={props.submit}>
          <span className="glyphicon glyphicon-search" /> {props.blastType.toUpperCase()}
        </button>
      </div>
    </div>
  )
}

class SubmitBlast extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      input: undefined,
      seqType: 'Nucleotide',
      dbType: 'Protein',
      selectedGenomes: new Set()
    }
  }

  /**
  * Hard coded map of sequence types to blast database types to select the appropriate blast program
  * @type {Object}
  */
   BLASTTYPES = {
    'Nucleotide': {
        'Nucleotide': 'blastn',
        'Protein': 'blastx',
        'Translated nucleotide': 'tblastx'
      },
    'Protein': {
      'Protein': 'blastp',
      'Translated nucleotide': 'tblastn'
    }
  };

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
    const dbType = Object.keys(this.BLASTTYPES[seqType])[0]
    this.setState({
      seqType: seqType,
      dbType: dbType
    })
  }

  selectDbType = event => {
    event.preventDefault();
    const dbType = event.target.id;
    console.log('selectDbType',dbType)
    this.setState({
      dbType: dbType
    })
  }

  toggleGenomeSelect = event => {
    const genomeId = event.target.id;
    this.setState(prevState => {
      const selectedGenomes = cloneDeep(prevState.selectedGenomes);
      if (selectedGenomes.has(genomeId)){
        selectedGenomes.delete(genomeId)
      } else {
        selectedGenomes.add(genomeId)
      }
      return { selectedGenomes }
    })
  }

  submit = event => {
    event.preventDefault();
    const { seqType, dbType, input, selectedGenomes } = this.state;
    const blastType = this.BLASTTYPES[seqType][dbType];
    submitBlastJob.call({
      blastType: blastType,
      input: input,
      genomeIds: [...selectedGenomes]
    }, (err,res) => {
      console.log(err)
      FlowRouter.redirect(`/blast/${res}`)
    })
  }

  render(){
    return (
      this.props.loading ? 
      <div>LOADING</div> :
      <form className="container form-group" role="form" id="blast">
        <div className="card">
          <div className="card-header">Blast search</div>
          <div className="card-body">
            <SequenceInput 
              value = {this.state.input}
              seqType = {this.state.seqType}
              enterSequence = {this.enterSequence}
              selectSeqType = {this.selectSeqType}
            />
          </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <GenomeSelect 
                  genomes = {this.props.genomes}
                  selectedGenomes = {this.state.selectedGenomes}
                  toggleGenomeSelect={this.toggleGenomeSelect}
                />
              </li>
              <li className="list-group-item">
                Advanced options ...
              </li>
            </ul>
          <div className="card-footer">
            <div className="row">
              <label className="col-md-4">Search a ...</label>
              <div className="col-md-6">
                {
                  !this.state.input &&
                  <button type="button" className="btn btn-outline-secondary disabled">
                    <span className="fa fa-question-circle-o"></span> Enter sequence
                  </button>
                }
                {
                  this.state.input && this.state.selectedGenomes.size == 0 &&
                  <button type="button" className="btn btn-outline-secondary disabled">
                    <span className="fa fa-question-circle-o"></span> Select genome annotation
                  </button>
                }
                {
                  this.state.input && this.state.selectedGenomes.size > 0 && 
                  <SubmitButtons 
                    selectedDbType = {this.state.dbType}
                    dbTypes = {Object.keys(this.BLASTTYPES[this.state.seqType])}
                    selectDbType = {this.selectDbType}
                    blastType = {this.BLASTTYPES[this.state.seqType][this.state.dbType]}
                    submit = {this.submit}
                  />
                }
              </div>
            </div>
          </div>
        </div>
      </form>
    )
  }
}

export default withTracker(props => {
  const subscription = Meteor.subscribe('genomes');
  const loading = !subscription.ready();
  const genomes = genomeCollection.find({
    'annotationTrack.blastDb': {
      $exists: 1
    }
  }).fetch()
  return {
    loading,
    genomes
  }
})(SubmitBlast)