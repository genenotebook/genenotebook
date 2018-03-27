import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import classNames from 'classnames';

import AnnotationDownload from './AnnotationDownload.jsx';

import { downloadGenes } from '/imports/api/genes/download_genes.js';

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
      dataType: 'Annotations',
      downloading: false
    }
  }

  selectDataType = event => {
    this.setState({
      dataType: event.target.id
    })
  }

  startDownload = event => {
    this.setState({
      downloading: true
    })
    const geneQuery = this.props.selectedAll ? this.props.query : { ID: { $in: Array.from(this.props.selectedGenes) } };

    //download genes method should return download link url
    downloadGenes.call({ query: geneQuery, dataType: this.state.dataType }, (err,res) => {
      console.log(err,res)
      FlowRouter.redirect(`/download/${res}`)
    })
  }

  closeModal = event => {
    this.setState({
      downloading: false
    })
    this.props.toggleDownloadDialog()
  }

  render(){
    const { showDownloadDialog, toggleDownloadDialog, query, selectedAll, selectedGenes } = this.props;
    if (!showDownloadDialog) {
      return null
    }

    const geneQuery = selectedAll ? query : { ID: { $in: Array.from(selectedGenes) } };

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
                <button type="button" className="close" aria-label="Close" onClick={this.closeModal}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body card text-center">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs">
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
                </div>
              <p className="card-body">
                Downloading {this.state.dataType} data for 3 genes. <br/>
                Please select further options below.
              </p>
              {
                DATATYPE_COMPONENTS[this.state.dataType]
              }
              <div className="card-body">
              </div>
                Annotation format
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="annotation-format" checked readOnly />
                  <label className="form-check-label" htmlFor="annotation-format">
                    gff3
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                {
                  this.state.downloading ? 
                  <button type="button" className="btn btn-success" disabled>
                    <span className="fa fa-circle-o-notch fa-spin"/> Preparing download URL
                  </button> :
                  <button type="button" className="btn btn-success" onClick={this.startDownload}>
                    Download
                  </button>
                }
                <button 
                  type="button" 
                  className="btn btn-outline-danger" 
                  data-dismiss="modal" 
                  onClick={this.closeModal}>
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