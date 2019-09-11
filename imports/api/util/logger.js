/* eslint-disable class-methods-use-this */
import { Meteor } from 'meteor/meteor';

class Logger {
  constructor({ logging = true, warning = true, debugging = true }) {
    this.logging = logging;
    this.warning = warning;
    this.debugging = debugging;
  }

  get dateTime() {
    return new Date().toISOString();
  }

  log(message) {
    if (this.logging) console.log('## LOG:', this.dateTime, message);
  }

  warn(message) {
    if (this.warning) console.warn('## WARNING:', this.dateTime, message);
  }

  debug(message) {
    if (this.debugging) console.debug('## DEBUG:', this.dateTime, message);
  }
}

const logger = Meteor.isDevelopment ? console : new Logger({ debugging: false });

export default logger;
