/* eslint-env mocha */
import chai from 'chai';
import logger from '/imports/api/util/logger.js';
import { addTestGenome } from '/imports/startup/server/fixtures/addTestData.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { reverseComplement, parseAttributeString, translate, getGeneSequences } from './util.js';

describe('util', function testUtils() {
    it('parses attribute strings', function testParseAttributeString() {
      const testVal = "Name=AACH01000027.2_21;Target=pep_AACH01000027_1_1347 1 449;md5=b2a7416cb92565c004becb7510f46840;"
      const parsedVal = parseAttributeString(testVal)
      const expected =  {
          Name: "AACH01000027.2_21",
          Target: "pep_AACH01000027_1_1347 1 449",
          ms5: "b2a7416cb92565c004becb7510f46840"
      }
      chai.assert.deepEqual(parsedVal, expected)
  });

    it('Should print the reverse complement of a sequence', function testReverseComplement() {
      const testVal = "AAATTTGC"
      const parsedVal = reverseComplement(testVal)
      const expected =  "GCAAATTT";
      chai.assert.equal(parsedVal, expected)
    });

    it('Should translate to a protein sequence', function testTranslate() {
      const testVal = "ACCACAACG"
      const parsedVal = translate(testVal)
      const expected =  "TTT"
      chai.assert.equal(parsedVal, expected)
    });

    describe('geneSeq', function testGeneSeq() {
        afterEach(() => {
          resetDatabase()
        });

        it('Should get a gene sequence', function testGetGeneSequences() {
          const {genomeId, genomeSeqId, geneId} = addTestGenome(annot=true)
          const gene = Genes.findOne({ID: geneId})
          const seq = getGeneSequences(gene)
          const expected =  [{
              ID: "BniB01g000010.2N.1",
              seq: "TTTT",
              prot: "F"
          }]
          chai.assert.deepEqual(parsedVal, expected)
        });
    });
});
