import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import getQueryCount from '/imports/api/methods/getQueryCount.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

import './landingpage.scss';

function GeneNumber({ _id: genomeId }) {
  const [geneNumber, setGeneNumber] = useState('...');
  getQueryCount.call({ query: { genomeId } }, (err, res) => {
    setGeneNumber(res);
  });
  return (
    <p>{ geneNumber }</p>
  );
}

function Stats({ genomes = [] }) {
  return (
    <article className="message is-light genome-stats">
      <div className="message-body">
        <table className="table is-hoverable is-fullwidth has-background-white-bis">
          <thead>
            <tr>
              <th className="has-text-weight-bold">Name</th>
              <th className="has-text-weight-bold">Organism</th>
              <th className="has-text-weight-bold has-text-centered">Status</th>
              <th className="has-text-weight-bold has-text-right">&#8470; genes</th>
            </tr>
          </thead>
          <tbody>
            {
            genomes.map(({
              _id, name, organism, isPublic,
            }) => (
              <tr key={_id} className="list-group-item d-flex justify-content-between">
                <td>{name}</td>
                <td>{ organism }</td>
                <td className="has-text-centered">
                  {
                  isPublic
                    ? <span className="tag is-success is-light">Public</span>
                    : <span className="tag is-warning is-light">Private</span>
                  }
                </td>
                <td className="has-text-right">
                  <GeneNumber _id={_id} />
                </td>
              </tr>
            ))
          }
          </tbody>
        </table>
      </div>
    </article>
  );
}

Stats.propTypes = {
  genomes: PropTypes.array,
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
        <article className="message is-info" role="alert">
          <div className="message-body">
            Currently no genomes are available
          </div>
        </article>
      )
      : (
        <article className="message is-info" role="alert">
          <div className="message-body">
            No public genomes are available.&nbsp;
            <Link to="/login">
              Sign in
            </Link>
            &nbsp;to access private data.
          </div>
        </article>
      )
  );
}

const withConditionalRendering = compose(
  withTracker(statsDataTracker),
  branch(isLoading, Loading),
  branch(hasNoGenomes, NoGenomes),
);

const StatsWithDataTracker = withConditionalRendering(Stats);

function LandingPage() {
  return (
    <>
      <section className="hero is-small is-light is-bold">
        <div className="hero-body">
          <h1 className="title"> GeneNoteBook </h1>
          <h1>Add cli test 1</h1>
          <h2 className="subtitle"> A collaborative notebook for genes and genomes </h2>
          <div className="box">
            <p className="font-weight-light">
              Through this site you can browse and query data for the following genomes:
            </p>
            <StatsWithDataTracker />
          </div>
          {
          !Meteor.userId()
          && (
          <div className="buttons are-small" role="group">
            <Link to="/register" className="button is-success">
              <span className="icon-user-add" aria-hidden="true" />
              &nbsp;Create account
            </Link>
            <Link to="/login" className="button is-link">
              <span className="icon-login" aria-hidden="true" />
              &nbsp;Sign in
            </Link>
            <a href="http://genenotebook.github.io/" className="button is-dark is-outlined">
              <span className="icon-github" aria-hidden="true" />
              &nbsp;About GeneNotebook
            </a>
          </div>
          )
        }
        </div>
      </section>

      <section className="hero is-link is-bold">
        <div className="hero-body">
          <div className="columns">

            <div className="column is-4">
              <div className="card">
                <div className="card-content">
                  <div className="media">
                    <div className="media-left card">
                      <figure className="is-48x48">
                        <span className="icon-clipboard has-text-primary" aria-hidden="true" style={{ fontSize: '2.4rem' }} />
                      </figure>
                    </div>
                    <div className="media-content">
                      <p className="title is-4 has-text-dark">
                        Gene Table
                      </p>
                      <p className="subtitle is-6 has-text-dark">
                        Intuitive browsing
                      </p>
                    </div>
                  </div>
                  <div className="content">
                    Browse through a table of genes with customizable queries
                  </div>
                  <div className="content">
                    <Link to="/genes" className="button is-primary is-light is-fullwidth">
                      <span className="icon-list" aria-hidden="true" />
                    &nbsp;Browse
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="column is-4">
              <div className="card">
                <div className="card-content">
                  <div className="media">
                    <div className="media-left card">
                      <figure className="is-48x48">
                        <span className="icon-search has-text-warning" aria-hidden="true" style={{ fontSize: '2.4rem' }} />
                      </figure>
                    </div>
                    <div className="media-content">
                      <p className="title is-4 has-text-dark">
                        Search
                      </p>
                      <p className="subtitle is-6 has-text-dark">
                        Custom search options
                      </p>
                    </div>
                  </div>
                  <div className="content">
                    Search genes by their attributes, such as GO-terms,
                    protein domains or manual annotations.
                  </div>
                  <div className="content">
                    <Link to={{ path: '/', state: { highLightSearch: true } }} className="button is-warning is-light is-fullwidth">
                      <span className="icon-search" aria-hidden="true" />
                &nbsp;Search
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="column is-4">
              <div className="card">
                <div className="card-content">
                  <div className="media">
                    <div className="media-left card">
                      <figure className="is-48x48">
                        <span className="icon-database has-text-link" aria-hidden="true" style={{ fontSize: '2.4rem' }} />
                      </figure>
                    </div>
                    <div className="media-content">
                      <p className="title is-4 has-text-dark">
                        BLAST
                      </p>
                      <p className="subtitle is-6 has-text-dark">
                        Search by sequence
                      </p>
                    </div>
                  </div>
                  <div className="content">
                    BLAST your protein or DNA sequence to genome annotations.
                  </div>
                  <div className="content">
                    <Link to="/blast" className="button is-light is-link is-fullwidth">
                      <span className="icon-database" aria-hidden="true" />
              &nbsp;Blast
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
