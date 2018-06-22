import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import hash from 'object-hash';
//import Future from 'fibers/future';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Job } from 'meteor/vsivsi:job-collection';

import { Genes } from '/imports/api/genes/gene_collection.js';
//import { Downloads } from '/imports/api/downloads/download_collection.js';

export const downloadGenes = new ValidatedMethod({
  name: 'downloadGenes',
  validate: new SimpleSchema({
    query: { 
      type: Object,
      blackbox: true 
    },
    dataType: { 
      type: String 
    },
    options: {
      type: Object,
      blackbox: true
    }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ query, dataType, options }){
    /**
     * If the query has not been used before, create a new file from it. 
     * Otherwise use the cached file and increment the download count.
     * Return md5 hash of download query as download url
     */
    console.log(`downloading ${dataType}`)
    console.log(query);
    
    const queryString = JSON.stringify(query);
    const optionString = JSON.stringify(options);

    const queryHash = hash(`${queryString}${dataType}${optionString}`);

    console.log(queryHash)
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    const existingJob = jobQueue.findOne({ 'data.queryHash': queryHash });

    if (typeof existingJob === 'undefined'){
      console.log('initiating new download job')
      const job = new Job(jobQueue, 'download', {
        queryString,
        queryHash,
        dataType,
        options
      });
      job.priority('high').save();
    }

    return queryHash
  }
})