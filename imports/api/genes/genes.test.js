/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { similarSequencesCollection } from '/imports/api/genes/alignment/similarSequenceCollection.js'
import { resetDatabase } from 'meteor/xolvio:cleaner';

import './genes/alignment/addSimilarSequence.js';'

// Required for sending jobs
import '/imports/api/jobqueue/process-similarsequences.js';


describe('genes', function testGenes() {
  let adminId, newUserId
  let adminContext
  let userContext

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });

  it('Should add Diamond xml file', function addDiamond() {
    // Increase timeout
    this.timeout(20000);

    const diamondParams = {
      'assets/app/data/Diamond_blastp_bnigra.xml',
      parser: 'xml',
      program: 'diamond',
      algorithm: 'blastx',
      matrix: 'blosum62',
      database: 'nr',
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addSimilarSequence._execute({}, diamondParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      addSimilarSequence._execute(userContext, diamondParams);
    }).to.throw('[not-authorized]');

    let result = addSimilarSequence._execute(adminContext, diamondParams);
    logger.log(result)

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N.1"}).fetch();
    logger.log(simSeq)

  });

  it('Should add a Diamond txt file', function addDiamond() {
    // Increase timeout
    this.timeout(20000);

    const diamondParams = {
      'assets/app/data/Diamond_blastx_bnigra.txt',
      parser: 'txt',
      program: 'diamond',
      algorithm: 'blastx',
      matrix: 'BLOSUM90',
      database: 'nr',
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addSimilarSequence._execute({}, diamondParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      addSimilarSequence._execute(userContext, diamondParams);
    }).to.throw('[not-authorized]');

    let result = addSimilarSequence._execute(adminContext, diamondParams);
    logger.log(result)

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N.1"}).fetch();
    logger.log(simSeq)

  });

  it('Should add a Blast txt file', function addDiamond() {
    // Increase timeout
    this.timeout(20000);

    const diamondParams = {
      'assets/app/data/BLAST_blastx_bnigra.txt',
      parser: 'txt',
      program: 'blast',
      matrix: 'BLOSUM90',
      database: 'nr',
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addSimilarSequence._execute({}, diamondParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      addSimilarSequence._execute(userContext, diamondParams);
    }).to.throw('[not-authorized]');

    let result = addSimilarSequence._execute(adminContext, diamondParams);
    logger.log(result)

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N.1"}).fetch();
    logger.log(simSeq)

  });

})
