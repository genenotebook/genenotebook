/**
 * Copyright (C) 2014-2017 by Vaughn Iverson
 * job-collection is free software released under the MIT/X11 license.
 * See included LICENSE file for details.
 */
const currentVersion = '1.6.0';

Package.describe({
  summary: 'A persistent and reactive job queue for Meteor, supporting distributed workers that can run anywhere',
  name: 'vsivsi:job-collection',
  version: currentVersion,
  git: 'https://github.com/vsivsi/meteor-job-collection.git',
});

Npm.depends({
  'meteor-job': '1.5.2',
});

Package.onUse(function(api) {
  api.versionsFrom('1.6.1');

  api.use([
    'mongo',
    'check',
    'ecmascript',
  ], ['server', 'client']);

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.export('Job');
  api.export('JobCollection');
});

Package.onTest(function (api) {
  api.use(`vsivsi:job-collection@${currentVersion}`, ['server', 'client']);
  api.use('ecmascript');
  api.use('check', ['server', 'client']);
  api.use('tinytest', ['server', 'client']);
  api.use('test-helpers', ['server', 'client']);
  api.use('ddp', 'client');
  api.addFiles('test/job_collection_tests.js', ['server', 'client']);
});
