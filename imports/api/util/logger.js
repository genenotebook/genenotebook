import { Meteor } from 'meteor/meteor';

class Logger {
  constructor({ logging = true, warning = true, debugging = true }){
    this.logging = logging;
    this.warning = warning;
  }

  log = message => {
    if (this.logging) console.log('## LOG: ' + message);
  }

  warn = message => {
    if (this.warning) console.warn('## WARNING: ' + message);
  }

  debug = message => {
    if (this.debugging) console.debug('## DEBUG: ' + message);
  }
}

const logging = Meteor.isProduction ? false : true;

const debugging = Meteor.isDevelopment ? true : false;

const logger = new Logger({ logging, debugging });

export default logger;