/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import addDefaultAttributes from '/imports/startup/server/fixtures/addDefaultAttributes.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { attributeCollection } from './attributeCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { EditHistory } from './edithistory_collection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import scanGeneAttributes from './scanGeneAttributes.js';
import { updateAttributeInfo } from './updateAttributeInfo.js';
import { updateGene } from './updateGene.js';


describe('genesMethods', function testGenesMethods() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing genes methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });

  it('Should scan genes attributes', async function testScanGeneAttributes() {
    this.timeout(20000);
    addDefaultAttributes()

    const {genomeId, genomeSeqId} = addTestGenome(annot=true)

    const scanParams = {
      genomeId: genomeId,
      async: false
    };

    // Should fail for non-logged in
    chai.expect(() => {
      scanGeneAttributes._execute({}, scanParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      scanGeneAttributes._execute(userContext, scanParams);
    }).to.throw('[not-authorized]');

    await scanGeneAttributes._execute(adminContext, scanParams);
    //Meteor._sleepForMs(10000);

    attrs = attributeCollection.find({name: "myNewAttribute"}).fetch();

    chai.assert.lengthOf(attrs, 1)

    const attr = attrs[0]

    chai.assert.equal(attr.defaultShow , false)
    chai.assert.equal(attr.defaultSearch , false)
    chai.assert.deepEqual(attr.genomes , [genomeId])
  });

  it('Should update an attribute', function testUpdateAttribute() {

    addDefaultAttributes()

    const {genomeId, genomeSeqId} = addTestGenome(annot=true)

    const attributeId = attributeCollection.findOne({name: "Orthogroup"})._id

    const updateParams = {
      attributeId: attributeId,
      defaultShow: true,
      defaultSearch: true
    };

    // Should fail for non-logged in
    chai.expect(() => {
      updateAttributeInfo._execute({}, updateParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      updateAttributeInfo._execute(userContext, updateParams);
    }).to.throw('[not-authorized]');

    updateAttributeInfo._execute(adminContext, updateParams);

    const attr = attributeCollection.findOne({_id: attributeId});

    chai.assert.equal(attr.defaultShow , true)
    chai.assert.equal(attr.defaultSearch , true)

  });

  it('Should update a gene', function testUpdateGene() {

    this.timeout(20000);

    const {genomeId, genomeSeqId, geneId} = addTestGenome(annot=true)

    const updateParams = {
      geneId: geneId,
      update: {
        "$set": {
          "attributes.Name": "newGeneName",
          "attributes.newAttr": "newAttrValue"
        }
      }
    };

    const wrongParams =  {
      geneId: 'fakeId',
      update: {}
    }

    // Should fail for non-logged in
    chai.expect(() => {
      updateGene._execute({}, updateParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      updateGene._execute(userContext, updateParams);
    }).to.throw('[not-authorized]');

    // Should fail for an incorrect Id
    chai.expect(() => {
      updateGene._execute(adminContext, wrongParams);
    }).to.throw('Gene fakeId not found!');

    Meteor.wrapAsync(updateGene._execute(adminContext, updateParams));

    // updateGene is async (with callback), so wait for it to finish
    Meteor._sleepForMs(5000);

    // Check Gene update
    const gene = Genes.findOne({ID: geneId})
    chai.assert.equal(gene.attributes.Name , "newGeneName")
    chai.assert.equal(gene.attributes.newAttr , "newAttrValue")

    histories = EditHistory.find({ID: geneId}).fetch()
    chai.assert.lengthOf(histories, 1)
    const history = histories[0]

    chai.assert.equal(history.user , adminContext.userId)

    // Check attribute update
    const attrs = attributeCollection.find({name: "newAttr"}).fetch();
    chai.assert.lengthOf(attrs, 1)
    const attr = attrs[0]

    chai.assert.equal(attr.defaultShow , false)
    chai.assert.equal(attr.defaultSearch , false)
    chai.assert.deepEqual(attr.genomes , [genomeId])

  });

})
