import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

import fs from 'fs';
import zlib from 'zlib';

import { Genes } from '/imports/api/genes/gene_collection.js';

const DATATYPE_EXTENSIONS = {
  'Annotations': 'annotations.gff'
}

const queue = jobQueue.processJobs(
  'download',
  {
    concurrency: 1,
    payload: 1
  },
  (job, callback) => {
    console.log(job.data)
    const { queryHash, queryString, dataType } = job.data;
    const query = JSON.parse(queryString);
    const extension = DATATYPE_EXTENSIONS[dataType]

    const fileName = `Genebook_download_${queryHash}.${extension}.gz`;

    const writeStream = fs.createWriteStream(fileName);
    const compress = zlib.createGzip();
    compress.pipe(writeStream);

    // the finish event is emitted when all data has been flushed from the stream
    compress.on('finish', () => {  
        console.log('wrote all data to file');
    });

    Genes.find(query).forEach(gene => {
      console.log(gene.ID)
      compress.write(gene.ID)
    })

    // close the stream
    compress.end();

    //Meteor.call('interproscan',job.data.geneId)
    job.done(fileName)
    callback()
  })

