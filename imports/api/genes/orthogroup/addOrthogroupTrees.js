import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import logger from '/imports/api/util/logger.js';
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

const addOrthogroupTrees = new ValidatedMethod({
  name: 'addOrthogroupTrees',
  validate: new SimpleSchema({
    folderName: {
      type: String,
    },
    force: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    prefixes: {
      type: String,
      optional: true,
      custom() {
        /** Ignore prefixe argument with -f or --force parameter. */
        if (this.obj.force === true) {
          this.obj.prefixes = undefined;
          logger.warn('Prefixes are ignored because the -f or --force parameter is used.');
        } else if (!this.isSet || this.obj.prefixes.trim().length === 0) {
          throw new Meteor.Error(
            'Error required parameter',
            '-pfx or --prefixe is required. Please complete the prefix parameter (ignore it with the -f or --force parameter).',
          );
        }
        return true;
      },
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ folderName, prefixes }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    const job = new Job(
      jobQueue,
      'addOrthogroup',
      {
        folderName,
        prefixes,
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

export default addOrthogroupTrees;
