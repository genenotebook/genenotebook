import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { compose } from 'recompose';

import getQueryCount from '/imports/api/methods/getQueryCount.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './landingpage.scss';

function GeneNumber({ _id: genomeId, isPublic }) {
  const [geneNumber, setGeneNumber] = useState('...');
  getQueryCount.call({ genomeId }, (err, res) => {
    setGeneNumber(res);
  });
  return (
    <div className="btn-group" role="group">
      <button type="button" className="btn btn-sm btn-outline-dark px-2 py-0" disabled>
        {
        isPublic
          ? <span className="badge badge-success">Public</span>
          : <span className="badge badge-warning">Private</span>
      }
      </button>
      <button type="button" className="btn btn-sm btn-outline-dark px-2 py-0" disabled>
        <span className="badge badge-dark">{ geneNumber }</span>
        &nbsp;genes
      </button>
    </div>
  );
}

/*
class GeneNumber extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      geneNumber: '...',
    };
  }

  componentDidMount = () => {
    const { _id: genomeId } = this.props;
    const query = { genomeId };
    getQueryCount.call({ query }, (err, res) => {
      this.setState({
        geneNumber: new Intl.NumberFormat().format(res),
      });
    });
  }

  render() {
    const { geneNumber } = this.state;
    const { isPublic } = this.props;
    return (
      <div className="btn-group" role="group">
        <button type="button" className="btn btn-sm btn-outline-dark px-2 py-0" disabled>
          {
          isPublic
            ? <span className="badge badge-success">Public</span>
            : <span className="badge badge-warning">Private</span>
        }
        </button>
        <button type="button" className="btn btn-sm btn-outline-dark px-2 py-0" disabled>
          <span className="badge badge-dark">{ geneNumber }</span>
          &nbsp;genes
        </button>
      </div>
    );
  }
}
*/

function Stats({ genomes = [] }) {
  return (
    <ul className="list-group">
      {
        genomes.map(genome => (
          <li key={genome._id} className="list-group-item d-flex justify-content-between">
            <div className="d-inline-block ml-4">
              { genome.name }
              {' '}
              <span className="font-italic text-muted">
                { genome.organism }
              </span>
            </div>
            <div className="d-inline-block mr-4 pull-right">
              <GeneNumber {...genome} />
            </div>
          </li>
        ))
      }
    </ul>
  );
}

Stats.propTypes = {
  genomes: PropTypes.shape([]),
};

Stats.defaultProps = {
  genomes: [],
};

function statsDataTracker() {
  const genomeSub = Meteor.subscribe('genomes');
  const loading = !genomeSub.ready();
  const genomes = genomeCollection.find({}).fetch();
  return {
    loading,
    genomes,
  };
}

function hasNoGenomes({ genomes }) {
  return typeof genomes === 'undefined' || genomes.length === 0;
}

function NoGenomes() {
  return (
    Meteor.userId()
      ? (
        <div className="alert alert-dark" role="alert">
          <p className="text-muted mb-0">Currently no genomes are available</p>
        </div>
      )
      : (
        <div className="alert alert-dark" role="alert">
          <p className="text-muted mb-0">No public genomes are available. Sign in to access private data.</p>
        </div>
      )
  );
}

const withConditionalRendering = compose(
  withTracker(statsDataTracker),
  withEither(isLoading, Loading),
  withEither(hasNoGenomes, NoGenomes),
);

const StatsWithDataTracker = withConditionalRendering(Stats);

function LandingPage() {
  return (
    <div className="container">
      <div className="jumbotron my-2 pb-1 pt-4 bg-light border">
        <h1 className="genenotebook-title"> GeneNoteBook </h1>
        <h4 className="text-muted font-weight-light"> A collaborative notebook for genes and genomes </h4>
        <hr />
        <p className="lead font-weight-light">
          Through this site you can browse and query data for the following genomes:
        </p>
        <StatsWithDataTracker />
        <hr />
        {
          !Meteor.userId()
          && (
          <div className="btn-group mx-auto pb-3" role="group">
            <Link to="/register" className="btn btn-sm btn-outline-success">
              <span className="icon-user-add" aria-hidden="true" />
              &nbsp;Create account
            </Link>
            <Link to="/login" className="btn btn-sm btn-outline-primary">
              <span className="icon-login" aria-hidden="true" />
              &nbsp;Sign in
            </Link>
            <a href="http://genenotebook.github.io/" className="btn btn-sm btn-outline-dark">
              <span className="icon-github" aria-hidden="true" />
              &nbsp;About GeneNotebook
            </a>
          </div>
          )
        }
      </div>

      <div className="card-deck">

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <span className="icon-clipboard" aria-hidden="true" style={{ fontSize: '3rem' }} />
            <h3 className="card-title">
              Gene Table
            </h3>
            <h6 className="card-subtitle text-muted mb-2">
              Browse through a table of genes with customizable queries
            </h6>
            <Link to="/genes" className="btn btn-outline-dark btn-sm px-2 py-0 btn-block">
              <span className="icon-list" aria-hidden="true" />
              &nbsp;Browse
            </Link>
          </div>
        </div>

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <span className="icon-search" aria-hidden="true" style={{ fontSize: '3rem' }} />
            <h3 className="card-title">
              Custom Search
            </h3>
            <h6 className="card-subtitle mb-2 text-muted">
              Search genes based on attributes like GO terms or protein domains
            </h6>
            <Link to={{ path: '/', state: { highLightSearch: true } }} className="btn btn-outline-dark btn-sm px-2 py-0 btn-block">
              <span className="icon-search" aria-hidden="true" />
              &nbsp;Search
            </Link>
          </div>
        </div>

        <div className="card bg-light text-center mb-3">
          <div className="card-body">
            <span className="icon-database" aria-hidden="true" style={{ fontSize: '3rem' }} />
            <h3 className="card-title">
              BLAST
            </h3>
            <h6 className="card-subtitle mb-2 text-muted">
              BLAST your protein or DNA sequence to genome annotations
            </h6>
            <Link to="/blast" className="btn btn-outline-dark btn-sm px-2 py-0 btn-block">
              <span className="icon-database" aria-hidden="true" />
              &nbsp;Blast
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LandingPage;
