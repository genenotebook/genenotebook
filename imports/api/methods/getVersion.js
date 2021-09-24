/* eslint-disable import/no-dynamic-require */
// import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

// import fs from 'fs';

// import logger from '/imports/api/util/logger.js';

// const pkg = {};

const getVersion = new ValidatedMethod({
  name: 'getVersion',
  validate: null,
  applyOptions: {
    noRetry: false,
  },
  run() {
    let version = '...';
    if (!this.isSimulation) {
      version = process.env.GNB_VERSION;
    }
    return version;
  },
});

export default getVersion;
