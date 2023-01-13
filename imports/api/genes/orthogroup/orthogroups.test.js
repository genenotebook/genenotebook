/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup/orthogroupCollection.js'
import { resetDatabase } from 'meteor/xolvio:cleaner';

import addOrthogroupTrees from './addOrthogroupTrees.js';

// Required for sending jobs
import '/imports/api/jobqueue/process-orthogroup.js';


describe('orthogroups', function testOrthogroups() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing Orthogroups methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });


  it('Should add an orthogroup file', function addOrthogroup() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot=true)

    const orthoGroupsParams = {
      folderName: 'assets/app/data/orthogroups/',
      force: false,
      prefixes: "Brassica_nigra",
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addOrthogroupTrees._execute({}, orthoGroupsParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      addOrthogroupTrees._execute(userContext, orthoGroupsParams);
    }).to.throw('[not-authorized]');


    let result = addOrthogroupTrees._execute(adminContext, orthoGroupsParams);

    const gene = Genes.findOne({ID: "BniB01g000010.2N"})

    chai.assert.isDefined(gene.orthogroups, 'orthogroups key is undefined')

    const orthoId = gene.orthogroups._str
    const orthos = orthogroupCollection.find({_id: new Mongo.ObjectID(orthoId)}).fetch();

    chai.assert.lengthOf(orthos, 1, "No orthogroup data found")

    const ortho = orthos[0]

    chai.assert.sameMembers(ortho.geneIds, ['BniB01g000010.2N'])
    chai.assert.equal(ortho.size, 84.5)

  });

})
