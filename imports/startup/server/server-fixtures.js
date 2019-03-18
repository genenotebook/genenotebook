/* eslint-disable import/prefer-default-export */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import fs from 'fs';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import logger from '/imports/api/util/logger.js';

const addDefaultUsers = () => {
  // Add default users
  if (Meteor.users.find().count() === 0) {
    logger.log('Adding default admin user');
    const adminId = Accounts.createUser({
      username: 'admin',
      email: 'admin@admin.com',
      password: 'admin',
      profile: {
        first_name: 'admin',
        last_name: 'admin',
      },
    });
    Roles.addUsersToRoles(adminId, ['admin', 'curator', 'user', 'registered']);

    logger.log('Adding default guest user');
    const guestId = Accounts.createUser({
      username: 'guest',
      email: 'guest@guest.com',
      password: 'guest',
      profile: {
        first_name: 'guest',
        last_name: 'guest',
      },
    });
    Roles.addUsersToRoles(guestId, ['user', 'registered']);
  }
};

const addDefaultAttributes = () => {
  // add some default attributes to filter on
  const permanentAttributes = [
    {
      name: 'Note',
      query: 'attributes.Note',
    },
    {
      name: 'Orthogroup',
      query: 'orthogroupId',
    },
    {
      name: 'Protein domains',
      query: 'subfeatures.protein_domains',
    },
    {
      name: 'Gene ID',
      query: 'ID',
    },
    {
      name: 'Has changes',
      query: 'changed',
    },
    {
      name: 'Genome',
      query: 'genomeId',
    },
  ];
  permanentAttributes.forEach(({ name, query }) => {
    const existingAttribute = attributeCollection.findOne({ name });
    if (typeof existingAttribute === 'undefined') {
      logger.log(`Adding default filter option: ${name}`);
      attributeCollection.update(
        {
          name,
        },
        {
          $setOnInsert: {
            name,
            query,
            defaultShow: false,
            defaultSearch: false,
            allGenomes: true,
          },
        },
        {
          upsert: true,
        },
      ); // end update
    } // end if
  }); // end foreach
};

const checkBlastDbs = () => {
  // Check if blast DBs exist
  genomeCollection
    .find({
      'annotationTrack.blastDb': {
        $exists: true,
      },
    })
    .fetch()
    .filter((genome) => {
      const { annotationTrack } = genome;
      const { blastDb } = annotationTrack;
      const hasNucDb = fs.existsSync(blastDb.nucl);
      const hasProtDb = fs.existsSync(blastDb.prot);
      logger.log({
        genome,
        blastDb,
        hasProtDb,
        hasNucDb,
      });
      return !hasProtDb || !hasNucDb;
    })
    .forEach(({ _id }) => {
      genomeCollection.update(
        {
          _id,
        },
        {
          $unset: {
            'annotationTrack.blastDb': true,
          },
        },
      );
    });
};

const startJobQueue = () => {
  // Start the jobqueue
  jobQueue.allow({
    // Grant permission to admin only
    admin(userId) {
      return Roles.userIsInRole(userId, 'admin');
    },
  });
  return jobQueue.startJobServer();
};

Meteor.startup(() => {
  logger.log(`GeneNoteBook server started, serving at ${Meteor.absoluteUrl()}`);
  addDefaultUsers();
  addDefaultAttributes();
  checkBlastDbs();
  startJobQueue();
});
