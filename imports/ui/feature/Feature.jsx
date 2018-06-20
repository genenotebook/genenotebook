import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Job } from 'meteor/vsivsi:job-collection';

import React from 'react';
import { compose } from 'recompose';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Genes } from '/imports/api/genes/gene_collection.js'; 

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import NotFound from '/imports/ui/main/NotFound.jsx';

import Info from './Info.jsx';
import GenemodelContainer from './Genemodel.jsx';
import SeqContainer from './Seq.jsx';
import ProteinDomains from './ProteinDomains.jsx'; 
import Orthogroup from './Orthogroup.jsx';

import SampleSelection from './SampleSelection.jsx'; 
import ExpressionPlot from './ExpressionPlot.jsx';

const Loading = () => {
  return (
    <div>
      Loading...
    </div>
  )
}

const isLoading = ({ loading, ...props}) => {
  return loading
}

const isNotFound = ({ gene, ...props }) => {
  return typeof gene === 'undefined'
}

const dataTracker = () => {
  const geneId = FlowRouter.getParam('_id');
  const geneSub = Meteor.subscribe('singleGene', geneId);
  const loading = !geneSub.ready();
  const gene = Genes.findOne({ ID: geneId });
  return {
    loading,
    gene
  }
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound)
)

class Feature extends React.Component {
  constructor(props){
    super(props)
  }

  runInterproscan = event => {
    console.log(`submitting ${this.props.gene.ID} to interpro`)
    const jobOptions = { geneId: this.props.gene.ID }

    const job = new Job(jobQueue, 'interproscan', jobOptions)

    job.priority('normal').save()
  }

  render(){
    return (
      <div className="container">
        <div className="card genebook-feature">
          <div className="card-header">
            <a className="navbar-brand" href="#">{this.props.gene.ID}</a>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger pull-right" 
              onClick={this.runInterproscan}
              >Interproscan</button>
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a className="nav-link active" href="#info">Info</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#gene-model">Gene model</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#sequence">Sequence</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#protein-domains">Protein domains</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#expression">Expression</a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <Info gene={this.props.gene} />
            <section id='genemodel'>
              <hr/>
              <h3>Genemodel</h3>
              <GenemodelContainer gene={this.props.gene} />
            </section>
            <SeqContainer gene={this.props.gene} />
            <section id='protein-domains'>
              <hr />
              <h3>Protein domains</h3>
              <ProteinDomains gene={this.props.gene} />
            </section>
            {
              this.props.gene.orthogroup &&
              <Orthogroup gene={this.props.gene} />
            }
            <section id='expression'>
              <hr />
              <h3>Expression</h3>
              <SampleSelection gene={this.props.gene}>
                <ExpressionPlot/>
              </SampleSelection>
            </section>
          </div>
          <div className="card-footer text-muted">
            Gene info
          </div>
        </div>
      </div>
    )
  }
}

export default withConditionalRendering(Feature)