import React from 'react';
import find from 'lodash/find';

import { getGeneSequences } from '/imports/api/util/util.js';

import './seq.scss';

const Controls = (props) => {
  let seqTypes = ['nucl','prot']
  return (
    <div>
      <div className="btn-group btn-group-sm sequence-toggle pull-right" role="group">
        {
          seqTypes.map(seqType => {
            return (
              <button
                key={seqType}
                type="button"
                className={`btn btn-outline-secondary ${seqType === props.seqType ? 'active' : ''}`}
                onClick={props.selectSeqType.bind(this,seqType)}
              >
                {seqType === 'prot' ? 'Protein' : 'Nucleotide'}
              </button>
            )
          })
        }
      </div>

      <div className="btn-group btn-group-sm pull-right">
        <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          { props.selectedTranscript } <span className="caret"></span>
        </button>
        <ul className="dropdown-menu">
          {
            props.transcripts.map( transcript => {
              return (
                <li key={transcript}>
                  <a 
                    href="#" 
                    className="select-transcript-seq" 
                    onClick={props.selectTranscript.bind(this,transcript)} >
                    { transcript }
                  </a>
                </li>
              )
            })
          }
        </ul>
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
