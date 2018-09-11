import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';

import fs from 'fs';
import zlib from 'zlib';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Genes } from '/imports/api/genes/gene_collection.js';

const DATATYPE_EXTENSIONS = {
  'Annotations': 'annotations.gff',
  'Sequences': 'fasta'
}

const FORMATS = {
  'Annotations': 'gff3',
  'Sequences': 'fasta',
  'Expression': 'tsv'
}

const formatGff3 = ({ gene, options }) => {
  return gene.ID
}

const formatTsv = ({ gene, options}) => {
  return gene.ID
}

const formatFasta = ({ gene, options }) => {
  const { seqType } = options;
  const sequences = getGeneSequences(gene);
  const fastaArray = sequences.map(seq => {
    const seqString = seq[seqType].match(/.{1,80}/g).join('\n');
    return `>${seq.ID}\n${seqString}`
  })
  return fastaArray.join('\n')
}

const formatGene = ({ gene, format, options }) => {
  switch(format){
    case 'gff3': return formatGff3({ gene, options });
    case 'fasta': return formatFasta({ gene, options });
    case 'tsv': return formatTsv({ gene, options });
    default: return gene.ID
  }
}

const processDownload = (job, callback) => {
  console.log(job.data)
  const { queryHash, queryString, dataType, options } = job.data;
  const query = JSON.parse(queryString);
  const extension = DATATYPE_EXTENSIONS[dataType]
  const format = FORMATS[dataType];

  const fileName = `GeneNoteBook_download_${queryHash}.${extension}.gz`;

  const writeStream = fs.createWriteStream(fileName);
  const compress = zlib.createGzip();
  compress.pipe(writeStream);

  // the finish event is emitted when all data has been flushed from the stream
  compress.on('finish', async () => {  
    console.log('wrote all data to file');
    job.done(fileName);
    callback();
  });

  const querySize = Genes.find(query).count();
  const stepSize = Math.round(querySize / 10);

  Genes.find(query).forEach((gene, index) => {
    if (index % stepSize === 0){
      job.progress(index, querySize, { echo: true })
    }
    const lines = formatGene({ gene, format, options });
    compress.write(`${lines}\n`)
  })

  // close the stream
  compress.end();

}

const options = {
  concurrency: 1,
  payload: 1
}

jobQueue.processJobs('download', options, processDownload)

