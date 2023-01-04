/* eslint-env mocha */
import chai from 'chai';
import logger from '/imports/api/util/logger.js';

import { parseNewick, parseAttributeString } from './util.js';

describe('util', function testUtils() {
  describe('parseNewick', function testParseNewick() {
    it('parses properly formatted newick strings', function properParseNewick() {
      chai.assert.equal(1, 1);
    });
    it('throws an error on malformatted newick strings', function throwNewickError() {
      function badFn() {
        throw Error();
      }
      chai.expect(badFn).to.throw();
    });
  });
  describe('parseAttributeString', function() {
    it('parses properly formatted gff3 attribute strings');
  });
});
