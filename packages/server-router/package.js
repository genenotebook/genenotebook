/* @flow */
/* global Package: false, Npm: false */

Package.describe({
  name: 'mhagmajer:server-router',
  version: '1.2.6',
  summary: 'Server router with authentication for Meteor',
  git: 'https://github.com/mhagmajer/server-router',
  documentation: 'README.md',
});

Npm.depends({
  'babel-plugin-syntax-flow': '6.18.0',
  'babel-plugin-transform-flow-strip-types': '6.22.0',
  'path-to-regexp': '6.2.0',
  'query-string': '7.0.1',
  'url-parse': '1.5.3',
  'invariant': '2.2.4',
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
  ]);
  api.mainModule('src/server/server-router.js', 'server');
  api.mainModule('src/client/server-router-client.js', 'client');
});

Package.onTest((api) => {
  api.use([
    'ecmascript',
    'tinytest',
    'mhagmajer:server-router',
  ]);
  api.mainModule('server-router-tests.js');
});
