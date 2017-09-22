import { Meteor } from 'meteor/meteor';
import jobQueue from './jobqueue.js';
import  spawn  from 'spawn-promise';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { getGeneSequences } from '/imports/api/util/util.js';


jobQueue.processJobs(
  'makeBlastDb',
  {
    concurrency: 2,
    payload: 1
  },
  async function(job, callback){
    console.log('processing makeblastdb')
    console.log(job.data)
    const { trackName, dbType } = job.data;


    const trackId = trackName.split(/ |\./).join('_')

    const geneNumber = Genes.find({ track: trackName }).count()
    const stepSize = Math.round(geneNumber / 10);
    console.log(`scanning ${geneNumber} genes`)
    
    
    const fasta = Genes.find({ track: trackName }).map( (gene, index) => {

      if (index % stepSize === 0){
        job.progress(index, geneNumber, { echo: true })
      }
      
      let transcriptFasta = getGeneSequences(gene).map(transcript => {
        let sequence = dbType === 'prot' ? transcript.pep : transcript.seq
        //keep track of gene ID and transcript ID for later processing
        return `>${gene.ID} ${transcript.ID}\n${sequence}`
      }).join('\n')
      return transcriptFasta
    }).join('\n')
    
    const outFile = `${trackId}.${dbType}`
    const options = ['-dbtype', dbType, '-title', trackId, '-out', outFile];
    console.log(options)

    const dbFile =  await spawn('makeblastdb', options, fasta)
      .then( result => {
        let stdout = result.toString();
        if (stdout){
          console.log(`makeblastdb stdout:${stdout}`)
        }

        Tracks.findAndModify({
          query: {
            trackName: trackName 
          },
          update: { 
            $set: {
              [`blastdbs.${dbType}`]: `${trackId}.${dbType}` 
            }
          } 
        })
        return `${trackId}.${dbType}` 
      }).catch(error => {
        console.error(error)
      })
    console.log(`${dbFile} done`)
    
    job.done(dbFile)
    callback()
  }
)
