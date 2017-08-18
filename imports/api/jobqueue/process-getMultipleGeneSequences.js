import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

const queue = jobQueue.processJobs(
  'getMultipleGeneSequences',
  {
    concurrency: 1,
    payload: 1
  },
  function(job, callback){
    
    job.done()
    callback()
  })