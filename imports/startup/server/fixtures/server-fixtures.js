import { Meteor } from 'meteor/meteor';

import logger from '/imports/api/util/logger.js';

import addDefaultUsers from './addDefaultUsers.js';
import addDefaultAttributes from './addDefaultAttributes.js';
import checkBlastDbs from './checkBlastDbs.js';
import startJobQueue from './startJobQueue.js';

Meteor.startup(() => {
  logger.log(`GeneNoteBook server started, serving at ${Meteor.absoluteUrl()}`);
  addDefaultUsers();
  addDefaultAttributes();
  checkBlastDbs();
  startJobQueue();
});
