import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
// import { Job } from 'meteor/vsivsi:job-collection';

import React from 'react';
import { compose, branch, renderComponent } from 'recompose';
import hash from 'object-hash';

// import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
// import logger from '/imports/api/util/logger.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import NotFound from '/imports/ui/main/NotFound.jsx';

import GeneralInfo from './GeneralInfo.jsx';
import Genemodel from './Genemodel.jsx';
import Seq from './Seq.jsx';
import ProteinDomains from './ProteinDomains.jsx';
import Orthogroup from './Orthogroup.jsx';

import GeneExpression from './geneExpression/GeneExpression.jsx';

import './singleGenePage.scss';

function hasOwnProperty(obj, prop) {
  return Object.hasOwnProperty.call(obj, prop);
}

function Loading() {
  return <div>Loading...</div>;
}

function isLoading({ loading }) {
  return loading;
}

function isNotFound({ gene }) {
  return typeof gene === 'undefined';
}

function geneDataTracker({ match, genomeDataCache }) {
  const { geneId } = match.params;
  const geneSub = Meteor.subscribe('singleGene', { geneId });
  const gene = Genes.findOne({ ID: geneId });
  const loading = !geneSub.ready();
  return {
    loading,
    gene,
    genomeDataCache,
  };
}

function genomeDataTracker({ gene, genomeDataCache }) {
  // const genomeSub = Meteor.subscribe('genomes');
  const { genomeId } = gene;
  let genome;
  let genomeSub;
  if (hasOwnProperty(genomeDataCache, genomeId)) {
    genome = genomeDataCache[genomeId];
  } else {
    genomeSub = Meteor.subscribe('genomes');
    genome = genomeCollection.findOne({ _id: gene.genomeId });
    genomeDataCache[genomeId] = genome;
  }

  const loading = typeof genomeSub !== 'undefined'
    ? !genomeSub.ready()
    : false;
  return {
    loading,
    gene,
    genome,
  };
}

function SingleGenePage({ gene, genome = {} }) {
  return (
    <div className="container">
      <div className="card single-gene-page">
        <header className="has-background-light">
          <h4 className="title is-size-4 has-text-weight-light">
            {`${gene.ID} `}
            <small className="text-muted">{genome.name}</small>
          </h4>
          <div className="tabs is-boxed">
            <ul>
              <li className="is-active">
                <a href="#general-info">
                  General Information
                </a>
              </li>
              <li>
                <a href="#genemodel">
                  Gene model
                </a>
              </li>
              <li>
                <a href="#sequence">
                  Coding Sequence
                </a>
              </li>
              <li>
                <a href="#protein-domains">
                  Protein Domains
                </a>
              </li>
              <li>
                <a href="#orthogroup">
                  Orthogroup
                </a>
              </li>
              <li>
                <a href="#expression">
                  Expression
                </a>
              </li>
            </ul>
          </div>
        </header>
        <div className="card-content">
          <GeneralInfo
            key={hash(gene.attributes)}
            gene={gene}
            genome={genome}
          />
          <section id="genemodel">
            <Genemodel gene={gene} showXAxis showHeader resizable />
          </section>
          <Seq gene={gene} />
          <section id="protein-domains">
            <ProteinDomains gene={gene} showHeader />
          </section>
          <section id="orthogroup">
            <Orthogroup gene={gene} showHeader />
          </section>
          <section id="expression">
            <GeneExpression gene={gene} showHeader />
          </section>
        </div>
        <div className="card-footer text-muted">
          Gene info page for
          {' '}
          {gene.ID}
        </div>
      </div>
    </div>
  );
}

export default compose(
  withTracker(geneDataTracker),
  withEither(isLoading, Loading),
  withEither(isNotFound, NotFound),
  withTracker(genomeDataTracker),
  withEither(isLoading, Loading),
)(SingleGenePage);
