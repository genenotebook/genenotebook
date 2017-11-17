import React from 'react';
import classNames from 'classnames';

import './DownloadDialog.scss';

const AnnotationDownload = props => {
  return (
    <div></div>
  )
}

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

DATATYPE_COMPONENTS = {
  'Annotations': <AnnotationDownload />,
  'Sequences': <SequenceDownload />,
  'Expression data': <ExpressionDownload />
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
    const { show, onClose } = this.props;
    if (!show) {
      return null
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
                    return (
                      <li key={dataType} className="nav-item">
                        <a 
                          className={
                            classNames('nav-link',{
                              'active': this.state.dataTypes === dataType
                            })
                          }
                          id={dataType}
                          onClick={this.selectDataType} >
                          {dataType}
                        </a>
                      </li>
                    )
                  })
                }
                </ul>
              </div>
              {
                DATATYPE_COMPONENTS[this.state.dataType]
              }
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