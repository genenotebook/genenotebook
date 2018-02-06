import React from 'react';
import classNames from 'classnames';

import AnnotationDownload from './AnnotationDownload.jsx';

import './DownloadDialog.scss';


const SequenceDownload = props => {
  return (
    <div></div>
  )
}

const ExpressionDownload = props => {
  return (
    <div></div>
  )
}

export default class DownloadDialogModal extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      dataType: 'Annotations'
    }
  }

  selectDataType = event => {
    this.setState({
      dataType: event.target.id
    })
  }

  render(){
    const { show, onClose, query, selectedAll, selectedGenes } = this.props;
    if (!show) {
      return null
    }

    const geneQuery = selectedAll ? query : { ID: Array.from(selectedGenes) };

    const DATATYPE_COMPONENTS = {
      'Annotations': <AnnotationDownload geneQuery={geneQuery} />,
      'Sequences': <SequenceDownload geneQuery={geneQuery} />,
      'Expression data': <ExpressionDownload geneQuery={geneQuery} />
    }
    return (
      <div>
        <div className="backdrop" />
        <div className="modal" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Download options</h5>
                <button type="button" className="close" aria-label="Close" onClick={onClose}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <ul className="nav nav-tabs">
                {
                  Object.keys(DATATYPE_COMPONENTS).map(dataType => {
                    console.log(dataType, this.state.dataType)
                    return (
                      <li key={dataType} className="nav-item">
                        <a 
                          className={
                            classNames('nav-link', {
                              'active': this.state.dataType === dataType
                            })
                          }
                          id={dataType}
                          onClick={this.selectDataType}
                          href="#" >
                          {dataType}
                        </a>
                      </li>
                    )
                  })
                }
                </ul>
              
              {
                DATATYPE_COMPONENTS[this.state.dataType]
              }
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-success">
                  Download
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-danger" 
                  data-dismiss="modal" 
                  onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}