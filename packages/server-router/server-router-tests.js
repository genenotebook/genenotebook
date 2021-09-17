import { Tinytest } from 'meteor/tinytest';

import { ServerRouter } from 'meteor/mhagmajer:server-router';

Tinytest.add('server-router - example', (test) => {
  test.equal(2 + 2, 4);
});
