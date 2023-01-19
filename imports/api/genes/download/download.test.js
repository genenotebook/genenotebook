/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import logger from '/imports/api/util/logger.js';
import { addTestUsers, addTestGenome, addTestTranscriptome } from '/imports/startup/server/fixtures/addTestData.js';
import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import fs from 'fs';
import readline from 'readline';
import zlib from 'zlib';

import downloadGenes from './downloadGenes.js';

// Required for sending jobs
import '/imports/api/jobqueue/process-download.js';


const readFile = async (gzipFile) => {
  let lineReader = readline.createInterface({
    input: fs.createReadStream(gzipFile).pipe(zlib.createGunzip())
  });

  logger.log("Reading " + gzipFile)

  let data = []

  for await (const line of lineReader){
    data.push(line);
  }

  return data

  //lineReader.on('line', (line) => {
  //});
}


describe('download', function testDownload() {
  let adminId, newUserId
  let adminContext
  let userContext
  let dataFile

  logger.log("Testing Download methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
    if (typeof dataFile !== 'undefined') {
      fs.rmSync(dataFile, {
        force: true,
      });
    }
  });


  it('Should download an annotation file', async function downloadAnnot() {
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
    dataFile = result.value
    const stat = fs.statSync(dataFile)

    chai.assert.equal(stat.size, 124)

    const expected = [
      '##gff-version 3',
      'B1\tAAFC_GIFS\tgene\t13640\t15401\t.\t-\t-\t',
      'B1\tAAFC_GIFS\tmRNA\t13641\t15400\t.\t-\t.\tParent=BniB01g000010.2N',
      'B1\tAAFC_GIFS\tCDS\t13641\t13653\t.\t-\t.\tParent=BniB01g000010.2N.1'
    ]

    const data = await readFile(dataFile)
    chai.assert.deepEqual(data, expected)

  });

  it('Should download a sequence file', async function downloadSequence() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot=true)

    const dlParams = {
      query: {ID: "BniB01g000010.2N"},
      dataType: 'Sequence',
      options: {seqType: "nucl", primaryTranscriptOnly: false},
      async: true
    };

    const { result } = downloadGenes._execute(adminContext, dlParams);
    dataFile = result.value
    const stat = fs.statSync(dataFile)

    chai.assert.equal(stat.size, 51)

    const expected = [
      ">BniB01g000010.2N.1",
      "AGTTTAGAATAC"
    ]
    const data = await readFile(dataFile)
    chai.assert.deepEqual(data, expected)

  });

  it('Should download an expression file', async function downloadExpression() {
    // Increase timeout
    this.timeout(20000);

    const {genomeId, genomeSeqId, geneId} = addTestGenome(annot=true)
    const {expId, transcriptomeId} = addTestTranscriptome(genomeId, geneId)

    const dlParams = {
      query: {ID: "BniB01g000010.2N"},
      dataType: 'Expression',
      options: {selectedSamples: ["replicaGroup"]},
      async: true
    };

    const { result } = downloadGenes._execute(adminContext, dlParams);
    dataFile = result.value
    const stat = fs.statSync(dataFile)

    chai.assert.equal(stat.size, 59)

    const expected = [
      "gene_id\treplicaGroup",
      "BniB01g000010.2N\t60"
    ]

    const data = await readFile(dataFile)
    chai.assert.deepEqual(data, expected)
  });

})
