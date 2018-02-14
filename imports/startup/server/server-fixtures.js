import { Meteor } from 'meteor/meteor';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Attributes }from '/imports/api/genes/attribute_collection.js';

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
  //add the viewing, editing and expression option, 
  //since some keys are dynamic it will not allways be present on any gene, 
  //but we do want to filter on this
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

  // Start the myJobs queue running
  jobQueue.allow({
    // Grant permission to admin only
    admin: function (userId, method, params) {
      return Roles.userIsInRole(userId,'admin')
    }
  });
  return jobQueue.startJobServer();
});
