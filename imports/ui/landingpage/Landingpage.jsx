import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { queryCount } from '/imports/api/methods/queryCount.js';
import { ReferenceInfo } from '/imports/api/genomes/reference_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './landingpage.scss';

class GeneNumber extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      geneNumber: '...'
    }
  }

  componentDidMount = () => {
    const { referenceId } = this.props;
    const query = { reference: referenceId };
    queryCount.call({ query }, (err,res) => {
      this.setState({
        geneNumber: res
      })
    })
  }

  render(){
    const { geneNumber } = this.state;
    return <button type='button' className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
      <span className='badge badge-dark'>{ new Intl.NumberFormat().format(geneNumber) }</span> genes
    </button>
  }
};

const Stats = ({ genomes }) => {
  return <ul className='list-group'>
    {
      genomes.map(genome => {
        return <li key={genome._id} className='list-group-item'>
          <div className="d-inline-block mr-1">
            { genome.name }
          </div>
          <div className="d-inline-block ml-1">
            <GeneNumber {...genome} />
          </div>
        </li>
      })
    }
  </ul>
}

const statsDataTracker = () => {
  const genomeSub = Meteor.subscribe('referenceInfo');
  const loading = !genomeSub.ready();
  const genomes = ReferenceInfo.find({}).fetch();
  return {
    loading,
    genomes
  }
}

const withConditionalRendering = compose(
  withTracker(statsDataTracker),
  withEither(isLoading, Loading)
)

const StatsWithDataTracker = withConditionalRendering(Stats);

const Landingpage = () => {
  return (
    <div className="container">
      <div className="jumbotron my-2 pb-1 pt-4 bg-light border">
        <h1 className="display-4"> {Meteor.settings.public.name} </h1>
        <h4 className="text-muted font-weight-light"> A collaborative notebook for genes and genomes </h4>
        <hr/>
        <p className="lead font-weight-light">
          Through this site you can browse and query data for the following genomes:
        </p>
        <StatsWithDataTracker />
        <hr/>
        <p>
          <a href="/register" className="btn btn-sm btn-success">
            <i className="fa fa-user-plus" aria-hidden="true"></i> Create an account
          </a>
          <a href="/login" className="btn btn-sm btn-primary">
            <i className="fa fa-sign-in" aria-hidden="true"></i> Sign in
          </a>
          <a href="http://genebook.readthedocs.io/" className="btn btn-sm btn-outline-dark">
            <i className="fa fa-github" aria-hidden="true"></i> About Genebook
          </a>
        </p>
      </div>

      <div className="card-deck">

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <img src="/svg/008-menu.svg" alt="" />
            <h3 className="card-title">
              Gene list
            </h3>
            <h6 className="card-subtitle mb-2 text-muted">
              Browse through a list of genes with customizable queries
            </h6>
            <a href="/genes" className="btn btn-dark btn-sm">
              <i className="fa fa-list-ul" aria-hidden="true"></i> Browse
            </a> 
          </div>
        </div>

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <img src="/svg/007-loupe.svg" alt="" />
          
            <h3 className="card-title">
              Advanced search
            </h3>
            <h6 className="card-subtitle mb-2 text-muted">
              Search genomes, genes, experiments, meta-data etc.
            </h6>
            <a href="#" className="btn btn-dark btn-sm">
              <i className="fa fa-search" aria-hidden="true"></i> Search
            </a> 
          </div>
        </div>

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <img src="/svg/001-server.svg" alt="" />
            <h3 className="card-title">
              BLAST
            </h3>
            <h6 className="card-subtitle mb-2 text-muted">
              BLAST your protein or DNA sequence to full genomes and annotations 
            </h6>
            <a href="/blast" className="btn btn-dark btn-sm">
              <i className="fa fa-server" aria-hidden="true"></i> Blast
            </a>
          </div>
        </div>

      </div>
    </div>
  )
};

export default Landingpage;
