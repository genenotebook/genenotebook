/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { dbxrefCollection } from '/imports/api/genes/dbxrefCollection.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import getQueryCount from './getQueryCount.js'
import fetchDbxref from './fetchDbxref.js'

describe('methods', function testMethods() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing Methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });


  it('Should get the genes query count', function testGetQueryCount() {
    addTestGenome(annot=true)

    const queryParams = {query: {ID: "BniB01g000010.2N"}}
    const count = getQueryCount._execute({}, queryParams)
    chai.assert.equal(count, 1)

  })

  it('Should get fetch a GO Dbxref', async function testFetchGoDbxref() {

    this.timeout(20000);

    const queryParams = {dbxrefId: "GO:0000001"}
    await fetchDbxref._execute({}, queryParams)

    const dbs = dbxrefCollection.find({dbxrefId: "GO:0000001"}).fetch();
    chai.assert.lengthOf(dbs, 1)

    const db = dbs[0]

    chai.assert.equal(db.description , "mitochondrion inheritance")
    chai.assert.equal(db.dbType , "go")
  })

  it('Should get fetch an Interpro Dbxref', async function testFetchInterproDbxref() {

    this.timeout(20000);

    const queryParams = {dbxrefId: "InterPro:IPR000001"}
    await fetchDbxref._execute({}, queryParams)

    const dbs = dbxrefCollection.find({dbxrefId: "InterPro:IPR000001"}).fetch();
    chai.assert.lengthOf(dbs, 1)

    const db = dbs[0]

    chai.assert.equal(db.description , "Kringle")
    chai.assert.equal(db.dbType , "interpro")
  })

  it('Should fail to create a Dbxref', function testFetchWrongDbxref() {
    const queryParams = {dbxrefId: "WrongIdFormat"}
    fetchDbxref._execute({}, queryParams)

    const dbs = dbxrefCollection.find({}).fetch();
    chai.assert.lengthOf(dbs, 0)
  })

});
