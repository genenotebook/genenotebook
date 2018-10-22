import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import { Genes } from '/imports/api/genes/gene_collection.js';

Accounts.onCreateUser( (options,user) => {
  console.log('onCreateUser')
  user.roles = ['registered'];
  if (typeof user.profile === 'undefined'){
    user.profile = {
      first_name: '',
      last_name: ''
    }
  }
  return user
})

Accounts.onLogout( ({ user, connection }) => {
  console.log('logout',user._id)
  Meteor.users.update({
    _id: user._id,
    'presence.status': 'online'
  },{
    $set: {
      'presence.status': 'offline'
    }
  })
})

Meteor.users.allow({
  update(userId, doc, fields, modifier){
    if (userId && Roles.userIsInRole(userId, 'admin')){
      return true
    }
  }
})