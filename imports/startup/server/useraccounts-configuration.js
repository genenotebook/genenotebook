import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import Genes from '/imports/api/genes/gene_collection.js';

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

Accounts.onLogout( (options) => {
  console.log('logout',options)
  Meteor.users.update({
    _id: options.user._id,
    'presence.status': 'online'
  },{
    $set: {
      'presence.status': 'offline'
    }
  })

  Genes.update({
    'viewing': options.user._id
  },{
    $pull: {
      'viewing': options.user._id
    }
  }, (err,res) => {
    Genes.update({
      'viewing': {
        $exists: true,
        $size: 0
      }
    },{
      $unset: {
        'viewing': 1
      }
    })
  })
  
  //Since we are on the server, the following does not work. Need to design a 'loggedIn' template / high order component
  //FlowRouter.redirect('/login')
})

Meteor.users.allow({
  update(userId, doc, fields, modifier){
    console.log('User update')
    console.log(doc)
    console.log(fields)
    console.log(modifier)
    if (userId && Roles.userIsInRole(userId, 'admin')){
      return true
    }
  }
})