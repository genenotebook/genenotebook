#!/usr/bin/env node

"use strict";

if (!module.parent){
  const commander = require('commander');
  const asteroid = require('asteroid');
  const path = require('path');
  const WebSocket = require('ws');

  let folder;

  commander
    .arguments('<interproscan_annotation.gff>')
    .option('-u, --username <username>','The user to authenticate as [REQUIRED]')
    .option('-p, --password <password>','The user\'s password [REQUIRED]')
    .action(function(file){
      folder = path.resolve(file);
    })
    .parse(process.argv)

  if ( commander.username === undefined ||
    commander.password === undefined ||
    folder === undefined ){
    commander.help()
  }

  const options = { 
    folder: folder 
  }
  
  console.log(process.argv.join(' '))
  console.log(options)

  const Connection = asteroid.createClass()

  const portal = new Connection({
    endpoint: 'ws://localhost:3000/websocket',
    SocketConstructor: WebSocket
  })

  portal.loginWithPassword({
    username: commander.username,
    password: commander.password
  }).then(result => {
    portal.call('addOrthogroupTrees', options)
    .then(result => {
      console.log(result)
      portal.disconnect()
    })
    .catch(error => {
      console.log(error)
      portal.disconnect()
    })
  })
}

