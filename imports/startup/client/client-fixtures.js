import { Accounts } from 'meteor/accounts-base';

global.Buffer = global.Buffer || require("buffer").Buffer;

Accounts.onLogin(() => {
  console.log('Accounts.onLogin called')
})