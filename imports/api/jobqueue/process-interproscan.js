import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

const queue = jobQueue.processJobs(
  'interproscan',
  {
    concurrency: 4,
    payload: 1
  },
  function(job, callback){
    console.log(job.data.geneId)
    Meteor.call('interproscan',job.data.geneId)
    job.done()
    callback()
  })
