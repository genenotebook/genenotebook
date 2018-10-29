import React from 'react';
import find from 'lodash/find';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './seq.scss';

const Controls = ({ seqType, selectSeqType, transcripts, selectTranscript, selectedTranscript }) => {
  const seqTypes = ['nucl','prot']
  return <React.Fragment>
    <div className="btn-group btn-group-sm sequence-toggle float-right" role="group">
      {
        seqTypes.map(sType => {
          const active = sType === seqType ? 'active' : 'border';
          const label = sType === 'prot' ? 'Protein' : 'Nucleotide';
          return <button key={sType} id={sType} type="button" onClick={selectSeqType}
              className={`btn btn-outline-dark px-2 py-0 ${active}`}>
              { label }
            </button>
        })
      }
    </div>

    <div className="btn-group btn-group-sm float-right">
      <Dropdown>
        <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
          { selectedTranscript }
        </DropdownButton>
        <DropdownMenu>
        <h6 className='dropdown-header'>Select transcript</h6>
        { 
          transcripts.map( transcript => {
            return <li key={transcript}>
              <a href="#" id={transcript} className="select-transcript-seq dropdown-item" 
                onClick={selectTranscript} >
                { transcript }
              </a>
            </li>
          })
        }
        </DropdownMenu>
      </Dropdown>
    </div>
  </React.Fragment>
}

export default class SeqContainer extends React.Component {
  constructor(props){
    super(props)
    const transcripts = this.props.gene.subfeatures.filter(sub => {
      return sub.type === 'mRNA'
    }).map(transcript => {
      return transcript.ID
    }).sort()

    const selectedTranscript = transcripts[0];

    this.state = {
      selectedTranscript,
      transcripts,
      seqType: 'nucl',
      showAll: false
    }
  }

  toggleShowAll = event => {
    event.preventDefault();
    this.setState({
      showAll: !this.state.showAll
    })
  }

  selectTranscript = event => {
    const selectedTranscript = event.target.id;
    this.setState({ selectedTranscript })
  }

  selectSeqType = event => {
    const seqType = event.target.id;
    this.setState({ seqType });
  }

  render(){
    const maxLength = 300;
    const { showAll, selectedTranscript, transcripts, seqType } = this.state;
    const { gene } = this.props;
    //const transcript = find(transcripts, { ID: selectedTranscript });
    //const showSequence = showAll ? 
    const sequences = getGeneSequences(gene);
    const sequence = find(sequences, { ID: selectedTranscript });
    const showSequence = showAll ? sequence[seqType] : sequence[seqType].slice(0, maxLength) + '...';
    const buttonText = showAll ? 'Show less' : 'Show more ...';

    return <div id="sequence">
      <hr />
      <Controls selectedTranscript = { selectedTranscript } 
        selectTranscript = { this.selectTranscript } transcripts = { transcripts }
        seqType = { seqType } selectSeqType = { this.selectSeqType } />
      <h3>Coding Sequence</h3>
      <div className="card seq-container">
        <p className="seq"> 
          >{ selectedTranscript } <br/> 
          { showSequence }
        </p>
        <a href='#' onClick={this.toggleShowAll}>
          <small>{ buttonText }</small>
        </a>
      </div>
    </div>
  }
}
