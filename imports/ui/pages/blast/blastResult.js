import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReacteDict } from 'meteor/reactive-dict';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import './blastResult.html'

const getJob = jobId => {
  return new Promise( (resolve,reject) => {
    jobQueue.getJob(jobId, (err,res) => {
      if ( err ){
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

Template.blastResult.helpers({
  isJob(){
    const blastJob = Template.instance().blastJob
    return blastJob.get('isJob')
  },
  isCompleted(){
    const blastJob = Template.instance().blastJob
    return blastJob.get('isCompleted')
  },
  results(){
    const blastJob = Template.instance().blastJob
    const results = blastJob.get('results')
    console.log(results)
    return results
  },
  hits(){
    const blastJob = Template.instance().blastJob
    const results = blastJob.get('results')
    const iterations = results.BlastOutput.BlastOutput_iterations
    const iteration = iterations[0].Iteration[0].Iteration_hits
    const hits = iteration[0].Hit
    return hits
  }
})

Template.blastResult.onCreated( function(){
  const template = this;
  const jobId = FlowRouter.getParam('_id');
  template.blastJob = new ReactiveDict({
    isJob: true,
    isCompleted: false,
    results: null
  });

  template.autorun(function(){
    template.subscribe('jobQueue')
    jobQueue.getJob(jobId, (err,job) => {
      console.log(err,job)
      if ( err ){
        template.blastJob.set('isJob',false)
      } else if (job === undefined){
        template.blastJob.set('isJob',false)
      } else {
        console.log(job.doc.result)
        if (job.doc.status === 'completed'){
          template.blastJob.set('isCompleted', true)
          template.blastJob.set('results', job.doc.result)
        } 
      }
    })
  })
})