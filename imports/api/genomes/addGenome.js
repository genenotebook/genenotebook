/* eslint-disable max-classes-per-file */
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';
import fs from 'fs';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';

const addGenome = new ValidatedMethod({
  name: 'addGenome',
  validate: new SimpleSchema({
    fileName: String,
    genomeName: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ fileName, genomeName }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }
    if (Meteor.isServer && !fs.existsSync(fileName)) {
      throw new Meteor.Error(`${fileName} is not an existing file`);
    }
    const existingGenome = genomeCollection.findOne({ name: genomeName });
    if (existingGenome) {
      throw new Meteor.Error(`Existing genome: ${genomeName}`);
    }

    const job = new Job(jobQueue, 'addGenome', { fileName, genomeName });
    const jobId = job.priority('high').save();

    return { jobId };
  },
});

export default addGenome;
