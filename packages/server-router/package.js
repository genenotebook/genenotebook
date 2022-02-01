/* global Package: false, Npm: false */

const currentVersion = '1.2.7';

Package.describe({
  name: 'mhagmajer:server-router',
  version: currentVersion,
  summary: 'Server router with authentication for Meteor',
  git: 'https://github.com/mhagmajer/server-router',
  documentation: 'README.md',
});

Npm.depends({
  'path-to-regexp': '6.2.0',
  'query-string': '7.1.0',
  'url-parse': '1.5.4',
  invariant: '2.2.4',
});

Package.onUse((api) => {
  api.versionsFrom('2.3.2');
  api.use([
    'underscore',
    'ejson',
    'ecmascript',
    'modules',
    'accounts-base',
    'webapp',
    'typescript',
  ]);
  api.mainModule('src/server/server-router.ts', 'server');
  api.mainModule('src/client/server-router-client.ts', 'client');
});

Package.onTest((api) => {
  api.use([
    'ecmascript',
    'tinytest',
    'mhagmajer:server-router',
  ]);
  api.mainModule('server-router-tests.js');
});
