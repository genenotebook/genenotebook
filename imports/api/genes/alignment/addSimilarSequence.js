import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import logger from '/imports/api/util/logger.js'
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

const addSimilarSequence = new ValidatedMethod({
  name: 'addSimilarSequence',
  validate: new SimpleSchema({
    fileName: { type: String },
    parser: {
      type: String,
      optional: true,
      allowedValues: ['xml', 'txt'],
    },
    program: {
      type: String,
      optional: true,
      allowedValues: ['blast', 'diamond'],
    },
    algorithm: {
      type: String,
      optional: true,
      custom() {
        if (!this.isSet && this.obj.parser !== 'xml') {
          throw new Meteor.Error(
            'Error required parameter',
            '-alg or --algorithm is required. Please indicate the algorithm used (e.g: blastn, blastp, blastx ...). Do not confuse with the program used (e.g: BLAST or Diamond).',
          );
        }
        return true;
      },
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
  run({ fileName, parser, program, algorithm, matrix, database }) {
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
        algorithm,
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

export default addSimilarSequence;
