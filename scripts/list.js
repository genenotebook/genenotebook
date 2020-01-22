#!/usr/bin/env node

if (!module.parent) {
  const commander = require('commander');
  const asteroid = require('asteroid');
  const WebSocket = require('ws');
  const fs = require('fs');

  let what;

  commander
    .arguments('<what>', 'What to list: "tracks" or "references"')
    .option('-u, --username <username>', 'The user to authenticate as [REQUIRED]')
    .option('-p, --password <password>', 'The user\'s password [REQUIRED]')
    .option('-s, --settings [settings file]', 'JSON file with GeneNoteBook settings, default is settings.json')
    .action((value) => { what = value; })
    .on('--help', () => {
      console.log('');
      console.log('  Examples:');
      console.log('');
      console.log('    $ node list.js -u admin -p admin -s example_settings.json references');
      console.log('    $ node list.js --username admin --password admin --settings example_settings.json references');
      console.log('');
    })
    .parse(process.argv);

  const { username, password } = commander;

  if (!(username || password || what)) {
    commander.help();
  }

  const settingsFile = commander.settings || 'settings.json';
  const settingString = fs.readFileSync(settingsFile);
  const settings = JSON.parse(settingString);

  const endpoint = `ws://localhost:${settings.private.port}/websocket`;
  const SocketConstructor = WebSocket;

  const Connection = asteroid.createClass();

  const geneNoteBook = new Connection({ endpoint, SocketConstructor });

  geneNoteBook.loginWithPassword({ username, password })
    .then((loginResult) => geneNoteBook.call('list', what))
    .then((listResults) => {
      listResults.forEach((result) => console.log(result));
      geneNoteBook.disconnect();
    })
    .catch((error) => {
      console.log(error);
      geneNoteBook.disconnect();
    });
}
