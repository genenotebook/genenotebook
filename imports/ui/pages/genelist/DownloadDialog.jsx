import React from 'react';
import classNames from 'classnames';

import './DownloadDialog.scss';

export default class DownloadDialogModal extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      format: 'gff3'
    }
  }

  selectFormat = event => {
    this.setState({
      format: event.target.id
    })
  }

  render(){
    const { show, onClose } = this.props;
    const formats = ['gff3', 'fasta']
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
                  formats.map(format => {
                    return (
                      <li key={format} className="nav-item">
                        <a 
                          className={
                            classNames('nav-link',{
                              'active': this.state.format === format
                            })
                          }
                          id={format}
                          onClick={this.selectFormat} >
                          {format}
                        </a>
                      </li>
                    )
                  })
                }
                </ul>
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