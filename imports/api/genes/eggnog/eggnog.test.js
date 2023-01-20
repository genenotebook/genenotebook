/* eslint-env mocha */
import { resetDatabase } from 'meteor/xolvio:cleaner';
import chai from 'chai';
import logger from '../../util/logger';
import { eggnogCollection } from './eggnogCollection';
import addEggnog from './addEggnog';
import { addTestUsers, addTestGenome } from '../../../startup/server/fixtures/addTestData';
import '../../jobqueue/process-eggnog';

describe('eggnog', function testEggnog() {
  let adminId;
  let newUserId;
  let adminContext;
  let userContext;

  logger.log('Testing EggnogMapper methods');

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = { userId: adminId };
    userContext = { userId: newUserId };
  });

  afterEach(() => {
    resetDatabase();
  });

  it('Should add Eggnog tsv file', function importggnog() {
    // Increase timeout
    this.timeout(20000);

    addTestGenome(annot = true);

    const eggNogParams = {
      fileName: 'assets/app/data/Bnigra_eggnog.tsv',
    };

    // Should fail for non-logged in
    chai.expect(() => {
      addEggnog._execute({}, eggNogParams);
    }).to.throw('[not-authorized]');

    // Should fail for non admin user
    chai.expect(() => {
      addEggnog._execute(userContext, eggNogParams);
    }).to.throw('[not-authorized]');

    const result = addEggnog._execute(adminContext, eggNogParams);

    const eggs = eggnogCollection.find({ query_name: 'BniB01g000010.2N.1' }).fetch();

    chai.assert.lengthOf(eggs, 1, 'No eggnog data found');

    const egg = eggs[0];

    chai.assert.equal(egg.seed_eggNOG_ortholog, '3711.Bra000457.1');
    chai.assert.equal(egg.seed_ortholog_evalue, '1.01e-260');
    chai.assert.equal(egg.seed_ortholog_score, '720.0');
    chai.assert.lengthOf(egg.eggNOG_OGs, 5);
    chai.assert.lengthOf(egg.GOs, 18);
    chai.assert.equal(egg.Description, 'UDP-glucuronic acid decarboxylase');
  });
});
