/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import addTestUsers from '/imports/startup/server/fixtures/addTestUsers.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { addGenome } from './addGenome.js'
import { updateGenome } from './updateGenome.js'
import { removeGenome } from './removeGenome.js'
import { addAnnotationTrack } from './addAnnotationTrack.js'
import { removeAnnotationTrack } from './removeAnnotationTrack.js'

describe('genomes', function testGenomes() {
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

  it('Should create a new genome', function createGenome() {
    let newGenome = {fileName: '/tests/data/Bnigra.fasta', genomeName: 'Brassica nigra', async:false};
    // Should fail for non-logged in
    chai.expect(() => {
      addGenome._execute({}, newGenome);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      addGenome._execute({}, newGenome);
    }).to.throw('[not-authorized]');

    let result = addGenome._execute(adminContext, newGenome);
    logger.log(result)

    const genomes = genomeCollection.find({name: "Brassica nigra"}).fetch();
    const genome = genomes[0];
    chai.assert.lengthOf(users, 1, "Genome exists")
    logger.log(genome)
  });


})
