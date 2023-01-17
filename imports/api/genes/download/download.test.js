/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import fs from 'fs';

import downloadGenes from './downloadGenes.js';

// Required for sending jobs
import '/imports/api/jobqueue/process-download.js';


describe('download', function testDownload() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing Download methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });


  it('Should download a file', function download() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot=true)

    const dlParams = {
      query: {ID: "BniB01g000010.2N"},
      dataType: 'Annotation',
      options: {},
      async: true
    };

    const { result } = downloadGenes._execute(adminContext, dlParams);
    logger.log(result)

    logger.log(fs.statSync(result.value))

  });

})

