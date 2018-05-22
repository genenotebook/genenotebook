import { Meteor } from 'meteor/meteor';

import { ServerRouter, AuthenticationRequiredError } from 'meteor/mhagmajer:server-router';

import fs from 'fs';
import path from 'path';

WebApp.connectHandlers.use(ServerRouter.middleware({
  paths: [],
  routes: {
    download(filename){
      console.log(`download ${filename}`)
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
        readStream.pipe(response)
      })

      readStream.on('error', err => {
        throw new Meteor.Error(err)
      })

      readStream.on('close', () => {
        console.log('finished readstream')
        response.end()
      })
    }
  }
}));
