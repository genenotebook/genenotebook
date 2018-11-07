import { Accounts } from 'meteor/accounts-base';
//import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Roles } from 'meteor/alanning:roles';

global.Buffer = global.Buffer || require("buffer").Buffer;

Accounts.onLogin(() => {
  const redirect = Session.get('redirectAfterLogin');
  if (typeof redirect !== 'undefined'){
    //FlowRouter.redirect(redirect)
  }
})

Accounts.onLogout(() => {
  //FlowRouter.go('/login')
})

//FlowRouter.wait();
//Tracker.autorun(() => {
//  if ( Roles.subscription.ready() && !FlowRouter._initialized ){
    //FlowRouter.initialize();
//  }
//})