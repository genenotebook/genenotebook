/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import makeBlastDb from './makeblastdb.js'
import removeBlastDb from './removeblastdb.js'
import submitBlastJob from './submitblastjob.js'

// Required for sending jobs
import '/imports/api/jobqueue/process-blast.js';
import '/imports/api/jobqueue/process-makeBlastDb.js';


describe('blastDb', function testblastDb() {
  let adminId, newUserId
  let adminContext
  let userContext
  let curatorContext

  beforeEach(() => {
    ({ adminId, newUserId, curatorId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
    curatorContext = {userId: curatorId}
  });

  afterEach(() => {
    resetDatabase()
  });

  it('Should create a new BlastDb', function testAddBlastdb() {
    // Increase timeout
    this.timeout(20000);

    const {genomeId, genomeSeqId} = addTestGenome(annot=true)

    // Might be a better way to get the path..
    const blastArgs = {
	genomeId: genomeId
    };
    // Should fail for non-logged in
    chai.expect(() => {
      makeBlastDb._execute({}, blastArgs);
    }).to.throw('[not-authorized]');

    // Should fail for non curator user
    chai.expect(() => {
      makeBlastDb._execute(userContext, blastArgs);
    }).to.throw('[not-authorized]');

    // Check curator context
    const result = makeBlastDb._execute(curatorContext, blastArgs);
    logger.log(result)

    Meteor._sleepForMs(10000)

    const genome = genomeCollection.findOne({_id: genomeId});

    logger.log(genome)
  })

})

