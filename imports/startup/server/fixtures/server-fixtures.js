import { Meteor } from 'meteor/meteor';

import logger from '/imports/api/util/logger.js';
import getVersion from '/imports/api/methods/getVersion.js';

import addDefaultUsers from './addDefaultUsers.js';
import addDefaultAttributes from './addDefaultAttributes.js';
import checkBlastDbs from './checkBlastDbs.js';
import startJobQueue from './startJobQueue.js';

Meteor.startup(() => {
  getVersion.call((err, res) => {
    if (err) logger.error(err);
    logger.log(
      `GeneNoteBook server started, serving at ${Meteor.absoluteUrl()}`
    );
    logger.log(`Running GeneNoteBook version ${res}`);
    addDefaultUsers();
    addDefaultAttributes();
    checkBlastDbs();
    startJobQueue();
  });
});
