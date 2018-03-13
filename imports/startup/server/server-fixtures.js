import { Meteor } from 'meteor/meteor';

import fs from 'fs';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

Meteor.startup( () => {
  if ( Meteor.users.find().count() === 0 ) {
    console.log('Adding default admin user');
    const adminId = Accounts.createUser({
      username: 'admin',
      email: 'admin@none.com',
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
        email: 'guest@none.com',
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
      name: 'Viewing',
      query: 'viewing'
    },
    {
      name: 'Editing',
      query: 'editing'
    },
    {
      name: 'Orthogroup',
      query: 'orthogroup'
    },
    {
      name: 'Protein domains',
      query: 'subfeatures.protein_domains'
    }]
  permanentAttributes.forEach( attribute => {
    console.log(`Adding default filter option: ${attribute.name}`)
    Attributes.findAndModify({
      query: { 
        name: attribute.name 
      },
      update: { 
        $setOnInsert: { 
          name: attribute.name, 
          query: attribute.query, 
          show: true, 
          canEdit: false, 
          reserved: true,
          allReferences: true 
        } 
      }, 
      new: true, 
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


  // Start the myJobs queue running
  jobQueue.allow({
    // Grant permission to admin only
    admin: function (userId, method, params) {
      return Roles.userIsInRole(userId,'admin')
    }
  });
  return jobQueue.startJobServer();
});
