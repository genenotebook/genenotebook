import { JobCollection, Job } from 'meteor/vsivsi:job-collection';
import later from 'meteor-later';

const jobQueue = new JobCollection('jobQueue', { noCollectionSuffix: true, later: later });

//immediately build a 'job cleaning job' so that the jobcollection does not fill up endlessly
new Job(jobQueue, 'cleanup', {})
  .repeat({ schedule: jobQueue.later.parse.text('every 20 minutes') })
  .save({ cancelRepeats: true })

const cleanup = jobQueue.processJobs(
  'cleanup',
  {
    pollInterval: false,
    workTimeout: 60 * 1000
  },
  (job,callback) => {
    let current = new Date()
    current.setMinutes(current.getMinutes() - 20 )
    ids = jobQueue.find({
      status: {
        $in: Job.jobStatusRemovable
      },
      updated: {
        $lt: current
      }
    },{
      fields: {
        _id: 1
      }
    }).map(job => job._id)

    if (ids.length > 0){
      jobQueue.removeJobs(ids)
    }
    job.done(`removed ${ids.length} old jobs`)
    callback()
  })

jobQueue.find({
  type: 'cleanup',
  status: 'ready'
}).observe({
  added(){
    return cleanup.trigger()
  }
})

export default jobQueue

