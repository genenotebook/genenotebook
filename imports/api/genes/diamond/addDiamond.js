import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import logger from '/imports/api/util/logger.js'
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

const addDiamond = new ValidatedMethod({
  name: 'addDiamond',
  validate: new SimpleSchema({
    fileName: { type: String },
    parser: {
      type: String,
      optional: true,
      allowedValues: ['tsv', 'tabular', 'xml', 'txt'],
    },
    program: {
      type: String,
      optional: true,
      allowedValues: ['blastx', 'blastp'],
    },
    matrix: {
      type: String,
      optional: true,
    },
    database: {
      type: String,
      optional: true,
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ fileName, parser, program, matrix, database }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    const job = new Job(
      jobQueue,
      'addDiamond',
      {
        fileName,
        parser,
        program,
        matrix,
        database,
      },
    );
    const jobId = job.priority('high').save();

    let { status } = job.doc;
    logger.debug(`Job status: ${status}`);
    while (status !== 'completed') {
      const { doc } = job.refresh();
      status = doc.status;
    }

    return { result: job.doc.result };
  },
});

export default addDiamond;
