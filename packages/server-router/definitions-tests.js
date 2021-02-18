/* @flow */

import { ServerRouterClient } from 'meteor/mhagmajer:server-router';

// $ExpectError
(new ServerRouterClient()).sayHello();
