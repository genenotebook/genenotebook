#!/usr/bin/env node

"use strict";

if (!module.parent){
  const spawn = require('child-process-promise').spawn;

  const repeats = 1000000;

  spawn('tee',[],{capture: ['stdout','stderr']})
    .progress( childProcess => {
      let stdin = childProcess.stdin;
      for (let i = 0; i < repeats; i++){
        let string = Math.random().toString(36) + '\n'
        stdin.write(string)
      }
      stdin.end()
    })
    .then(result => {
      console.log(result.stdout.toString())
    })
    .catch(error => {
      console.error(error)
    })
}


