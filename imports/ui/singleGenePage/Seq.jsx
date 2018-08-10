import React from 'react';
import find from 'lodash/find';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './seq.scss';

const Controls = (props) => {
  const seqTypes = ['nucl','prot']
  return (
    <div>
      <div className="btn-group btn-group-sm sequence-toggle float-right" role="group">
        {
          seqTypes.map(seqType => {
            const active = seqType === props.seqType ? 'active' : 'border';
            return (
              <button
                key={seqType}
                type="button"
                className={`btn btn-outline-dark px-2 py-0 ${active}`}
                onClick={props.selectSeqType.bind(this,seqType)}
              >
                {seqType === 'prot' ? 'Protein' : 'Nucleotide'}
              </button>
            )
          })
        }
      </div>

      <div className="btn-group btn-group-sm float-right">
        <Dropdown>
          <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
            { props.selectedTranscript }
          </DropdownButton>
          <DropdownMenu>
          <h6 className='dropdown-header'>Select transcript</h6>
          { 
            props.transcripts.map( transcript => {
              return (
                <li key={transcript}>
                  <a href="#" 
                    className="select-transcript-seq dropdown-item" 
                    onClick={props.selectTranscript.bind(this,transcript)} >
                    { transcript }
                  </a>
                </li>
              )
            })
          }
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  )
}

export default class SeqContainer extends React.Component {
  constructor(props){
    super(props)
    const transcripts = this.props.gene.subfeatures.filter(sub => {
      return sub.type === 'mRNA'
    }).map(transcript => {
      return transcript.ID
    }).sort()

    this.state = {
      selectedTranscript: transcripts[0],
      transcripts: transcripts,
      seqType: 'nucl'
    }
  }

  selectTranscript = (transcriptId) => {
    this.setState({selectedTranscript: transcriptId})
  }

  selectSeqType = (seqType) => {
    this.setState({seqType: seqType})
  }

  render(){
    const sequences = getGeneSequences(this.props.gene)
    const sequence = find(sequences, { ID: this.state.selectedTranscript })

    return (
      <div id="sequence">
        <hr />
        <Controls 
          selectedTranscript = { this.state.selectedTranscript } 
          selectTranscript = { this.selectTranscript }
          transcripts = { this.state.transcripts }
          seqType = { this.state.seqType }
          selectSeqType = { this.selectSeqType }
        />
        <h3>Sequence</h3>
        <div className="card seq-container">
          <p className="seq"> 
            >{ this.state.selectedTranscript } <br/> 
            { sequence[this.state.seqType] }
          </p>
        </div>
      </div>
    )
  }
}
