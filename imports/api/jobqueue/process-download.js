import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

const queue = jobQueue.processJobs(
  'download',
  {
    concurrency: 1,
    payload: 1
  },
  (job, callback) => {
    console.log(job.data)
    //Meteor.call('interproscan',job.data.geneId)
    job.done()
    callback()
  })

