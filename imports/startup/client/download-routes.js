import { ServerRouterClient } from 'meteor/mhagmajer:server-router';

export const serverRouterClient = new ServerRouterClient({
  routes: {
    download: 1
  }
});