import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

global.Buffer = global.Buffer || require("buffer").Buffer;

Accounts.onLogin(() => {
  const redirect = Session.get('redirectAfterLogin');
  if (typeof redirect !== 'undefined'){
    FlowRouter.redirect(redirect)
  }
})

Accounts.onLogout(() => {
  FlowRouter.go('/login')
})