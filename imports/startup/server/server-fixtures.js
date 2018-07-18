import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import fs from 'fs';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

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
      query: 'orthogroup'
    },
    {
      name: 'Protein domains',
      query: 'subfeatures.protein_domains'
    },
    {
      name: 'Gene ID',
      query: 'ID'
    }
  ]
  permanentAttributes.forEach( attribute => {
    console.log(`Adding default filter option: ${attribute.name}`)
    Attributes.update({
      name: attribute.name
    },
    {
      $setOnInsert: {
          name: attribute.name, 
          query: attribute.query, 
          show: true, 
          canEdit: false, 
          reserved: true,
          allGenomes: true 
      }
    },
    {
      upsert: true
    })
  })

  Tracks.find({ 
    blastdbs: { 
      $exists: true
    }
  }).fetch().filter(track => {
    const hasNucDb = fs.existsSync(track.blastdbs.nuc)
    const hasProtDb = fs.existsSync(track.blastdbs.prot)
    return !hasProtDb || !hasNucDb
  }).map(track => {
    Tracks.update({
      _id: track._id
    },{
      $unset: {
        blastdbs: true
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
