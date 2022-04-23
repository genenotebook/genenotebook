import { ValidatedMethod } from 'meteor/mdg:validated-method';

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
