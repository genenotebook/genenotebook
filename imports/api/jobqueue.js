import jobQueue from '/imports/startup/server/fixtures.js';

const queue = jobQueue.processJobs(
  'interproscan',
  {
    concurrency: 4,
    payload: 1
  },
  function(job, callback){
    console.log(job.data.geneId)
    job.done()
    callback()
  })


