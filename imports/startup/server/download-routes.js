import { ServerRouter, AuthenticationRequiredError } from 'meteor/mhagmajer:server-router';

import fs from 'fs';
import path from 'path';

const serverRouter = new ServerRouter();

/*
serverRouter.addPath({
  path: '/downloads/file/:filename',
  args: ({ filename }) => filename,
  async route(filename){
    console.log(filename, this.req)
    if (!this.userId) {
      throw new AuthenticationRequiredError();
    }
    const filePath = path.join(__dirname, filename);
    const stat = fs.statSync(filePath);
    this.res.writeHead(200, {
      'Content-Type': 'application/gzip',
      'Content-Length': stat.size
    })

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(this.res);
    readStream.end()
  }
})
*/
/*
WebApp.connectHandlers.use(serverRouter.middleware({
  paths: [''],
  routes: {
    download(filename){
      console.log(filename, this.req)
      if (!this.userId) {
        throw new AuthenticationRequiredError();
      }
      const filePath = path.join(__dirname, filename);
      const stat = fs.statSync(filePath);
      this.res.writeHead(200, {
        'Content-Type': 'application/gzip',
        'Content-Length': stat.size
      })

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(this.res);
      readStream.end()
    }
  }
}));
*/