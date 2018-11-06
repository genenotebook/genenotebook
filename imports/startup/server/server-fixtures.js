import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import fs from 'fs';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

Meteor.startup( () => {
  if ( Meteor.users.find().count() === 0 ) {
    console.log('Adding default admin user');
    const adminId = Accounts.createUser({
      username: 'admin',
      email: 'admin@admin.com',
      password: 'admin',
      profile: {
        first_name: 'admin',
        last_name: 'admin',
      }
    });
    Roles.addUsersToRoles(adminId,['admin','curator','user','registered']);

    console.log('Adding default guest user')
    const guestId = Accounts.createUser({
        username: 'guest',
        email: 'guest@guest.com',
        password: 'guest',
        profile: {
            first_name: 'guest',
            last_name: 'guest',
        }
      });
    Roles.addUsersToRoles(guestId,['user','registered'])
  }
  //add some default attributes to filter on
  const permanentAttributes = [
    {
      name: 'Note',
      query: 'attributes.Note'
    },
    {
      name: 'Orthogroup',
      query: 'orthogroupId'
    },
    {
      name: 'Protein domains',
      query: 'subfeatures.protein_domains'
    },
    {
      name: 'Gene ID',
      query: 'ID'
    },
    {
      name: 'Has changes',
      query: 'changed'
    },
    {
      name: 'Genome',
      query: 'genomeId'
    }
  ]
  permanentAttributes.forEach( ({ name, query }) => {
    console.log(`Adding default filter option: ${name}`)
    attributeCollection.update({
      name
    },
    {
      $setOnInsert: {
          name, 
          query, 
          defaultShow: false, 
          defaultSearch: false, 
          allGenomes: true 
      }
    },
    {
      upsert: true
    })
  })

  genomeCollection.find({ 
    'annotationTrack.blastDb': { 
      $exists: true
    }
  }).fetch().filter(genome => {
    const { annotationTrack } = genome;
    const { blastDb } = annotationTrack;
    const hasNucDb = fs.existsSync(blastDb.nucl)
    const hasProtDb = fs.existsSync(blastDb.prot)
    console.log({blastDb,hasProtDb,hasNucDb});
    return !hasProtDb || !hasNucDb
  }).map(({ _id }) => {
    genomeCollection.update({
      _id
    },{
      $unset: {
        'annotationTrack.blastDb': true
      }
    })
  })


  // Start the jobqueue
  jobQueue.allow({
    // Grant permission to admin only
    admin: function (userId, method, params) {
      return Roles.userIsInRole(userId,'admin')
    }
  });
  return jobQueue.startJobServer();
});
