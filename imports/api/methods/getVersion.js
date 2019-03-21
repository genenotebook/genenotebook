/* eslint-disable import/no-dynamic-require */
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import fs from 'fs';

let pkg = {};

if (Meteor.isServer) {
  const { argv } = process;
  const executable = argv[1];
  const isProduction = executable
    .split('/')
    .slice(-1)
    .pop() === 'genenotebook-run.js';

  const splitPosition = isProduction ? -1 : -4;
  const pkgFile = `${executable
    .split('/')
    .slice(0, splitPosition)
    .join('/')}/package.json`;
  pkg = JSON.parse(fs.readFileSync(pkgFile));
}

const getVersion = new ValidatedMethod({
  name: 'getVersion',
  validate: null,
  applyOptions: {
    noRetry: true,
  },
  run() {
    return pkg.version;
  },
});

export default getVersion;
