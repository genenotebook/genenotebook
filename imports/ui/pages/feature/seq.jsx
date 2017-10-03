import { Template } from 'meteor/templating';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';
import find from 'lodash/find';

import { getGeneSequences } from '/imports/api/util/util.js';

const Seq = (props) => {
  return (
    <div className="well">
      <p className="seq">>{ props.header } <br/> { props.sequence }</p>
    </div>
  )
}

const Controls = (props) => {
  let seqTypes = ['seq','pep']
  return (
    <div>
      <div className="btn-group sequence-toggle pull-right" role="group">
        {
          seqTypes.map(seqType => {
            return (
              <button
                key={seqType}
                type="button"
                className={`btn btn-default ${seqType === props.seqType ? 'active' : null}`}
                onClick={props.selectSeqType.bind(this,seqType)}
              >
                {seqType === 'pep' ? 'Protein' : 'Nucleotide'}
              </button>
            )
          })
        }
      </div>

      <div className="btn-group pull-right">
        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
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

class _SeqContainer extends React.Component {
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
      seqType: 'seq'
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
      <div>
        <Controls 
          selectedTranscript = { this.state.selectedTranscript } 
          selectTranscript = { this.selectTranscript }
          transcripts = { this.state.transcripts }
          seqType = { this.state.seqType }
          selectSeqType = { this.selectSeqType }
        />
        <h3>Sequence</h3>
        <Seq 
          header = { this.state.selectedTranscript }
          sequence = { sequence[this.state.seqType] }
        />
      </div>
    )
  }
}

export default SeqContainer = createContainer( props => {
  return {
    gene: props.gene
  }
}, _SeqContainer)

