/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome, addTestTranscriptome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

import { Genes } from '/imports/api/genes/geneCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import addTranscriptome from './addTranscriptome.js';
import updateSampleInfo from './updateSampleInfo.js'
import updateReplicaGroup from './updateReplicaGroup.js'

describe('transcriptomes', function testTranscriptomes() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing transcriptomes methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });


  it('Should add a transcriptome file', function testAddTranscriptome() {
    // Increase timeout
    this.timeout(20000);

    const {genomeId, genomeSeqId} = addTestGenome(annot=true)

    const transcriParams = {
      fileName: 'assets/app/data/Bnigra_abundance.tsv',
      sampleName: "mySample",
      replicaGroup: "replicaGroup",
      description: "A new description"
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addTranscriptome._execute({}, transcriParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      addTranscriptome._execute(userContext, transcriParams);
    }).to.throw('[not-authorized]');

    let result = addTranscriptome._execute(adminContext, transcriParams);

    const exps = ExperimentInfo.find({genomeId: genomeId}).fetch()

    chai.assert.lengthOf(exps, 1, "Did not find 1 Experimentation")

    const exp = exps[0]

    chai.assert.equal(exp.sampleName, 'mySample')
    chai.assert.equal(exp.replicaGroup, 'replicaGroup')
    chai.assert.equal(exp.description, 'A new description')

    const transcriptomes = Transcriptomes.find({experimentId: exp._id}).fetch()

    chai.assert.lengthOf(transcriptomes, 1, "Did not find 1 transcriptomes")

    const transcriptome = transcriptomes[0]

    chai.assert.equal(transcriptome.tpm, '1.80368')
    chai.assert.equal(transcriptome.est_counts, '21')

  })

    it('Should update a sample', function testUpdateSample() {
    // Increase timeout
    this.timeout(20000);

    const {genomeId, genomeSeqId, geneId} = addTestGenome(annot=true)
    const {expId, transcriptomeId} = addTestTranscriptome(genomeId, geneId)

    const updateParams = {
      _id: expId,
      sampleName: "myNewSample",
      replicaGroup: "newReplicaGroup",
      description: "A new description",
      permission: "admin"
    };

    // Should fail for non-logged in
    chai.expect(() => {
      updateSampleInfo._execute({}, updateParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      updateSampleInfo._execute(userContext, updateParams);
    }).to.throw('[not-authorized]');

    updateSampleInfo._execute(adminContext, updateParams);

    const exp = ExperimentInfo.findOne({_id: expId})

    chai.assert.equal(exp.sampleName, 'myNewSample')
    chai.assert.equal(exp.replicaGroup, 'newReplicaGroup')
    chai.assert.equal(exp.description, 'A new description')

  });

  it('Should update a replica group', function testUpdateReplica() {
    // Increase timeout
    this.timeout(20000);

    const {genomeId, genomeSeqId, geneId} = addTestGenome(annot=true)
    const {expId, transcriptomeId} = addTestTranscriptome(genomeId, geneId)

    const updateParams = {
      sampleIds: [expId],
      replicaGroup: "newReplicaGroup",
      isPublic: true,
      permission: "admin"
    };

    // Should fail for non-logged in
    chai.expect(() => {
      updateReplicaGroup._execute({}, updateParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      updateReplicaGroup._execute(userContext, updateParams);
    }).to.throw('[not-authorized]');

    updateReplicaGroup._execute(adminContext, updateParams);

    const exp = ExperimentInfo.findOne({_id: expId})

    chai.assert.equal(exp.replicaGroup, 'newReplicaGroup')
    chai.assert.equal(exp.isPublic, true)

  });

})
