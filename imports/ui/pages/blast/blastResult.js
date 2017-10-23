import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReacteDict } from 'meteor/reactive-dict';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import BlastResult from './BlastResult.jsx';

import './blastResult.html'

Template.blastResult.helpers({
  BlastResult(){
    return BlastResult
  }
})
