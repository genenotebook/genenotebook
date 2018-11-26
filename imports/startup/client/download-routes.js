import { ServerRouterClient } from 'meteor/mhagmajer:server-router';

const serverRouterClient = new ServerRouterClient({
  routes: {
    download: 1,
  },
});

export default serverRouterClient;
