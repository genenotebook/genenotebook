/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import addInterproscan from '../addInterproscan.js';

// Required for sending jobs
import '/imports/api/jobqueue/process-interproscan.js';


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


  it('Should add an interproscan tsv file', function addTsvInterpro() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot=true)

    const interproParams = {
      fileName: 'assets/app/data/Bnigra_interproscan.tsv',
      parser: "tsv",
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addInterproscan._execute({}, interproParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      addInterproscan._execute(userContext, interproParams);
    }).to.throw('[not-authorized]');


    let result = addInterproscan._execute(adminContext, interproParams);

    const gene = Genes.findOne({ID: "BniB01g000010.2N"})

    chai.assert.isDefined(gene.subfeatures[0].protein_domains, 'protein_domains key is undefined')

    const protein_domains = gene.subfeatures[0].protein_domains

    chai.assert.lengthOf(protein_domains, 2, "Did not find 2 protein domains")

    const firstProtein = protein_domains[0]

    chai.assert.equal(firstProtein.start, '212')
    chai.assert.equal(firstProtein.end, '401')
    chai.assert.equal(firstProtein.source, 'Gene3D')
    chai.assert.equal(firstProtein.score, '1.2E-59')
    chai.assert.equal(firstProtein.name, 'G3DSA:1.10.510.10')
    chai.assert.equal(firstProtein.interproId, 'Unintegrated signature')

  });

  it('Should add an interproscan gff3 file', function addTsvInterpro() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot=true)

    const interproParams = {
      fileName: 'assets/app/data/Bnigra_interproscan.gff',
      parser: "gff3",
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addInterproscan._execute({}, interproParams);
    }).to.throw('[not-authorized]');


    // Should fail for non admin user
    chai.expect(() => {
      addInterproscan._execute(userContext, interproParams);
    }).to.throw('[not-authorized]');


    let result = addInterproscan._execute(adminContext, interproParams);

    const gene = Genes.findOne({ID: "BniB01g000010.2N"})

    chai.assert.isDefined(gene.subfeatures[0].protein_domains, 'protein_domains key is undefined')

    const protein_domains = gene.subfeatures[0].protein_domains

    logger.log(protein_domains)

    chai.assert.lengthOf(protein_domains, 2, "Did not find 2 protein domains")

    const firstProtein = protein_domains[0]

    chai.assert.equal(firstProtein.start, '212')
    chai.assert.equal(firstProtein.end, '401')
    chai.assert.equal(firstProtein.source, 'Gene3D')
    chai.assert.equal(firstProtein.score, '1.2E-59')
    chai.assert.equal(firstProtein.name, 'G3DSA:1.10.510.10')
    chai.assert.equal(firstProtein.interproId, 'Unintegrated signature')

    });
})
