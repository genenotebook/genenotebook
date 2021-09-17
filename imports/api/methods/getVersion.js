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
      version = process.env.npm_package_version;
      // console.log({ version });
      /*
      console.log({ process });
      const { argv } = process;
      const executable = argv[1];
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
      */
    }
    return version;
  },
});

export default getVersion;
