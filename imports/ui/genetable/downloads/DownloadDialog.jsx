import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import classNames from 'classnames';

import AnnotationDownload from './AnnotationDownload.jsx';
import AnnotationDownloadOptions from './AnnotationDownloadOptions.jsx';
import SequenceDownload from './SequenceDownload.jsx';
import SequenceDownloadOptions from './SequenceDownloadOptions.jsx';
import ExpressionDownload from './ExpressionDownload.jsx';
import ExpressionDownloadOptions from './ExpressionDownloadOptions.jsx';

import { downloadGenes } from '/imports/api/genes/download_genes.js';
import { queryCount } from '/imports/api/methods/queryCount.js';

import './DownloadDialog.scss';

export default class DownloadDialogModal extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      dataType: 'Annotations',
      downloading: false,
      queryCount: '...',
      options: {}
    }
  }

  componentDidMount = () => {
    const query = DownloadDialogModal.queryFromProps(this.props);
    queryCount.call({ query }, (err,res) => {
      this.setState({
        queryCount: res
      })
    })
  }

  componentWillReceiveProps = nextProps => {
    const query = DownloadDialogModal.queryFromProps(nextProps)
    queryCount.call({ query }, (err, res) => {
      this.setState({
        queryCount: res
      })
    })
  }

  static queryFromProps = ({ selectedAllGenes, selectedGenes, query, ...props }) => {
    return selectedAllGenes ? query : { ID: { $in: [...selectedGenes] } }
  }

  updateQueryCount = ({ selectedAllGenes, selectedGenes, query, ...props }) => {
    const downloadQuery = selectedAllGenes ? query : { ID: { $in: [...selectedGenes] } };

    queryCount.call({ query: downloadQuery }, (err,res) => {
      console.log
      this.setState({
        queryCount: res
      })
    })
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
    const query = this.props.selectedAllGenes ? 
      this.props.query : { ID: { $in: Array.from(this.props.selectedGenes) } };

    const { dataType, options } = this.state;

    //download genes method returns download link url
    downloadGenes.call({ query, dataType, options }, (err,res) => {
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

  updateOptions = options => {
    this.setState({
      options
    })
  }

  render(){
    const { showDownloadDialog, toggleDownloadDialog, query, 
      selectedAllGenes, selectedGenes, ...props } = this.props;

    const { dataType, queryCount, downloading, options, ...state } = this.state;
    if (!showDownloadDialog) {
      return null
    }

    const downloadQuery = selectedAllGenes ? 
      query : { ID: { $in: Array.from(selectedGenes) } };

    const DATATYPE_COMPONENTS = {
      'Annotations': <AnnotationDownload query={downloadQuery} options={options}/>,
      'Sequences': <SequenceDownload query={downloadQuery} options={options}/>,
      'Expression data': <ExpressionDownload query={downloadQuery} options={options}/>
    }

    const OPTION_COMPONENTS = {
      'Annotations': <AnnotationDownloadOptions options={options} updateOptions={this.updateOptions} />,
      'Sequences': <SequenceDownloadOptions options={options} updateOptions={this.updateOptions} />,
      'Expression data': <ExpressionDownloadOptions options={options} updateOptions={this.updateOptions} />
    }

    return (
      <div>
        <div className="backdrop" />
        <div className="modal" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Download options</h5>
                <button 
                  type="button" 
                  className="close" 
                  aria-label="Close" 
                  onClick={this.closeModal}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body card">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs">
                  {
                    Object.keys(DATATYPE_COMPONENTS).map(dataType => {
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
                Downloading {dataType} data for {queryCount} genes. <br/>
                Please select further options below.
              </p>
              {
                DATATYPE_COMPONENTS[dataType]
              }
              <div className="card-body">
              {
                OPTION_COMPONENTS[dataType]
              }
              </div>
              <div className="modal-footer">
                {
                  downloading ? 
                  <button type="button" className="btn btn-success" disabled>
                    <span className="icon-spin"/> Preparing download URL
                  </button> :
                  <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={this.startDownload}>
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
    </div>
    )
  }
}