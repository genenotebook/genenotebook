/* eslint-disable import/no-dynamic-require */
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import fs from 'fs';

import logger from '/imports/api/util/logger.js';

let pkg = {};


const getVersion = new ValidatedMethod({
  name: 'getVersion',
  validate: null,
  applyOptions: {
    noRetry: true,
  },
  run() {
    let version;
    if (!this.isSimulation) {
      const { argv } = process;
      const executable = argv[1];
      console.log({ argv });
      const isProduction = executable
        .split('/')
        .slice(-1)
        .pop() === 'genenotebook-run.js';

      const splitPosition = isProduction ? -1 : -4;

      const folder = executable
        .split('/')
        .slice(0, splitPosition)
        .join('/');

      const pkgFile = `${folder}/package.json`;

      pkg = JSON.parse(fs.readFileSync(pkgFile));
      version = pkg.version;
      console.log({
        isProduction, splitPosition, folder, pkgFile, version,
      });
    }
    return version;
    // console.log({ pkg });
    // return pkg.version;
  },
});

export default getVersion;
