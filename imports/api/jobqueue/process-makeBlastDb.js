import { Meteor } from 'meteor/meteor';

import spawn  from 'spawn-promise';
import fs from 'fs';

import jobQueue from './jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { getGeneSequences } from '/imports/api/util/util.js';


jobQueue.processJobs(
  'makeBlastDb',
  {
    concurrency: 2,
    payload: 1
  },
  function(job, callback){
    console.log('processing makeblastdb')
    console.log(job.data)
    const { trackId } = job.data;

    //const trackId = trackName.split(/ |\./).join('_')

    const geneNumber = Genes.find({ trackId }).count()
    const stepSize = Math.round(geneNumber / 10);
    console.log(`scanning ${geneNumber} genes`)
    
    const tempFiles = {
      nucl: `tmp_${trackId}.nucl.fa`,
      prot: `tmp_${trackId}.prot.fa`
    }

    const tempFileHandles = {
      nucl: fs.createWriteStream(tempFiles.nucl),
      prot: fs.createWriteStream(tempFiles.prot)
    }
    
    Genes.find({ trackId }).forEach( (gene, index) => {

      if (index % stepSize === 0){
        job.progress(index, geneNumber, { echo: true })
      }
      
      getGeneSequences(gene).forEach(transcript => {
        //keep track of gene ID and transcript ID for later processing
        const header = `>${gene.ID} ${transcript.ID}\n`

        tempFileHandles.prot.write(header)
        tempFileHandles.prot.write(`${transcript.prot}\n`)

        tempFileHandles.nucl.write(header)
        tempFileHandles.nucl.write(`${transcript.nucl}\n`)
      })
    })

    tempFileHandles.nucl.end();
    tempFileHandles.prot.end();
    
    const dbFiles = Object.keys(tempFiles).map(async dbType => {
      const tempFile = tempFiles[dbType];

      const outFile = `${trackId}.${dbType}`
      const options = [
        '-dbtype', dbType, 
        '-title', trackId,
        '-in', tempFile, 
        '-out', outFile
        ];
      console.log(options)
      const dbFile =  await spawn('makeblastdb', options)
        .then( result => {
          let stdout = result.toString();
          if (stdout){
            console.log(`makeblastdb stdout:${stdout}`)
          }
          Tracks.update({
            _id: trackId
          },{
            $set: {
              [`blastdbs.${dbType}`]:`${trackId}.${dbType}`
            }
          })
          return `${trackId}.${dbType}` 
        }).catch(error => {
          console.error(error)
        })
      console.log(`${dbFile} done`)
      return dbFile
    })
    job.done(dbFiles)
    callback()
  }
)
