import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

const dataTracker = ({ ...props }) => {
  return {
    props
  }
}

class SequenceDownloadOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      initialized: false
    }
  }

  componentDidMount = () => {
    const defaultOptions = {
      selectedSeqType: 'nucl',
      fileFormat: '.fasta',
      primaryTranscriptsOnly: true
    }
    this.props.updateOptions(defaultOptions)
    this.setState({
      initialized: true
    })
  }

  changeSeqType = event => {
    const selectedSeqType = event.target.id;
    this.props.updateOptions({ selectedSeqType });
  }

  render(){
    const { initialized } = this.state;
    const { options } = this.props;
    const { selectedSeqType, primaryTranscriptsOnly } = options;
    return (
      initialized ?
      <form>
        <div className="row">
          <div className="col-sm-4">
            Sequence type
          </div>
          <div className="col-sm-8">
            {
              ['nucl','prot'].map(seqType => {
                const checked = seqType === selectedSeqType ? 'checked' : '';
                return (
                  <div key={seqType} className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id={seqType} 
                      checked={checked} 
                      onChange={this.changeSeqType}/>
                    <label 
                      className="form-check-label" 
                      htmlFor={seqType} >
                      { seqType === 'nucl' ? 'Nucleotide' : 'Protein' }
                    </label>
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className="row">
          <div className="col-sm-4">
           File format
          </div>
          <div className="col-sm-8">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox"
                id="file-format" 
                checked={true} 
                disabled={true} />
              <label 
                className="form-check-label" 
                htmlFor="file-format" >
                .fasta
              </label>
            </div>
          </div>
        </div>
        <div className='row'>
          <div className='col-sm-4'>
            Primary transcripts only
          </div>
          <div className='col-sm-8'>
            <div className='form-check'>
              <input className='form-check-input'
                type='checkbox'
                id='primary-transcripts-only'
                checked={primaryTranscriptsOnly} />
            </div>
          </div>
        </div>
      </form> :
      <div>
        Loading options
      </div>
    )
  }
}

export default withTracker(dataTracker)(SequenceDownloadOptions)