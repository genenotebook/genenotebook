7/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { similarSequencesCollection } from '/imports/api/genes/alignment/similarSequenceCollection.js'
import { resetDatabase } from 'meteor/xolvio:cleaner';

import addSimilarSequence from './addSimilarSequence.js';

// Required for sending jobs
import '/imports/api/jobqueue/process-similarsequences.js';


describe('alignment', function testAlignment() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing Blast/Diamond import methods")

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

    addTestGenome(annot=true)

    const diamondParams = {
      fileName: 'assets/app/data/Diamond_blastp_bnigra.xml',
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

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N"}).fetch();
    chai.assert.lengthOf(simSeq, 1, "No similar sequence found")

    const seq = simSeq[0]

    chai.assert.equal(seq.algorithm_ref, 'blastx')
    chai.assert.equal(seq.database_ref, 'nr')
    chai.assert.equal(seq.program_ref, 'diamond')
    chai.assert.equal(seq.query_len, 420)
    chai.assert.lengthOf(seq.iteration_hits, 1)

  });


  it('Should add a Diamond txt file', function addDiamond() {
    // Increase timeout
    this.timeout(20000);

    const diamondParams = {
      fileName: 'assets/app/data/Diamond_blastx_bnigra.txt',
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

    //Meteor._sleepForMs(10000);

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N.1"}).fetch();

    chai.assert.lengthOf(simSeq, 1, "No similar sequence found")

    const seq = simSeq[0]

    chai.assert.equal(seq.algorithm_ref, 'blastx')
    chai.assert.equal(seq.database_ref, 'nr')
    chai.assert.equal(seq.program_ref, 'diamond')
    chai.assert.equal(seq.query_len, 420)
    chai.assert.lengthOf(seq.iteration_hits, 1)

  });

  it('Should add a Blast txt file', function addDiamond() {
    // Increase timeout
    this.timeout(20000);

    const diamondParams = {
      fileName: 'assets/app/data/BLAST_blastx_bnigra.txt',
      parser: 'txt',
      program: 'blast',
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

    const simSeq = similarSequencesCollection.find({iteration_query: "BniB01g000010.2N.1"}).fetch();
    chai.assert.lengthOf(simSeq, 1, "No similar sequence found")

    const seq = simSeq[0]

    chai.assert.equal(seq.algorithm_ref, 'blastx')
    chai.assert.equal(seq.database_ref, 'nr')
    chai.assert.equal(seq.program_ref, 'blast')
    chai.assert.equal(seq.query_len, 420)
    chai.assert.lengthOf(seq.iteration_hits, 1)

  });

})
