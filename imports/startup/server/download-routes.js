import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ServerRouter, AuthenticationRequiredError } from 'meteor/mhagmajer:server-router';

import fs from 'fs';
import path from 'path';

import logger from '/imports/api/util/logger.js';

WebApp.connectHandlers.use(ServerRouter.middleware({
  paths: [],
  routes: {
    download(filename){
      logger.log(`download ${filename}`)
      if (!this.userId) {
        throw new AuthenticationRequiredError();
      }
      const filePath = path.join(filename);
      const stat = fs.statSync(filePath);

      const response = this.res;

      response.writeHead(200, {
        'Content-Type': 'application/gzip',
        'Content-Length': stat.size
      })

      const readStream = fs.createReadStream(filePath);
      readStream.on('open', () => {
        logger.debug('open readstream')
        readStream.pipe(response)
      })

      readStream.on('error', err => {
        throw new Meteor.Error(err)
      })

      readStream.on('close', () => {
        logger.debug('finished readstream')
        response.end()
      })
    }
  }
}));
