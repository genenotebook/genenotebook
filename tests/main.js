/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';

import chai from 'chai';

if (Meteor.isServer) {
  import '../imports/api/util/util.test.js';
  import '../imports/api/users/users.test.js';
}

if (Meteor.isClient) {
  if (Meteor.isAppTest) {
    import '/imports/ui/main/App.app-test.jsx';
  }
  import '/imports/ui/util/uiUtil.test.jsx';
}

describe('genenotebook', function () {
  if (!Meteor.isAppTest) {
    it('package.json has correct name', async function () {
      console.log('import package.json');
      const { name } = await import('../package.json');
      chai.assert.strictEqual(name, 'genenotebook');
    });
  }
  it('does something else');
});
