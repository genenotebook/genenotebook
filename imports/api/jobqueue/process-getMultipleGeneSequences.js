import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { getGeneSequences } from '/imports/api/util/util.js';

const queue = jobQueue.processJobs(
  'getMultipleGeneSequences',
  {
    concurrency: 1,
    payload: 1
  },
  function(job, callback){
    console.log(job.data);
    const jobSize = job.data.geneIds.length;
    const stepSize = Math.round(jobSize / 10)
    const geneSequences = job.data.geneIds.reduce( (obj, geneId, index) => {
      if (index % stepSize === 0){
        job.progress(index, jobSize)
      }
      let gene = Genes.findOne({ID: geneId})

      obj[geneId] = getGeneSequences(gene)
      return obj
    }, {})

    job.done(geneSequences)
    callback()
  })