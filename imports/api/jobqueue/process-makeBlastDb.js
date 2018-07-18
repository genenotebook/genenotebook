import { Meteor } from 'meteor/meteor';

import spawn  from 'spawn-promise';
import fs from 'fs';

import jobQueue from './jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
//import { Tracks } from '/imports/api/genomes/track_collection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { getGeneSequences } from '/imports/api/util/util.js';

const makeTempFiles = async ({ genomeId, job }) => {
  const geneNumber = Genes.find({ genomeId }).count()
  const stepSize = Math.round(geneNumber / 10);
  console.log(`scanning ${geneNumber} genes`)
  
  const tempFiles = {
    nucl: `tmp_${genomeId}.nucl.fa`,
    prot: `tmp_${genomeId}.prot.fa`
  }

  const tempFileHandles = {
    nucl: fs.createWriteStream(tempFiles.nucl),
    prot: fs.createWriteStream(tempFiles.prot)
  }
  
  Genes.find({ genomeId }).forEach( (gene, index) => {

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

  return tempFiles
}

const makeBlastDb = async ({ genomeId, fastaFile, dbType }) => {
  const outFile = `${genomeId}.${dbType}`
  const options = [
    '-dbtype', dbType, 
    '-title', genomeId,
    '-in', fastaFile, 
    '-out', outFile
    ];
  console.log(options)
  return spawn('makeblastdb', options)
    .then( result => {
      let stdout = result.toString();
      if (stdout){
        console.log(`makeblastdb stdout:${stdout}`)
      }
      genomeCollection.update({
        _id: genomeId
      }, {
        $set: {
          [`annotationTrack.blastDb.${dbType}`]: outFile
        }
      })
      return outFile
    })
}

jobQueue.processJobs(
  'makeBlastDb',
  {
    concurrency: 2,
    payload: 1
  },
  function(job, callback){
    console.log('processing makeblastdb')
    console.log(job.data)
    const { genomeId } = job.data;

    return makeTempFiles({ genomeId, job }).then(tempFiles => {
      return Promise.all([
        makeBlastDb({ dbType: 'nucl', genomeId: genomeId, fastaFile: tempFiles.nucl }),
        makeBlastDb({ dbType: 'prot', genomeId: genomeId, fastaFile: tempFiles.prot })
      ])
    }).then(dbFiles => {
      console.log({ dbFiles });
      job.done({ dbFiles });
      callback();
    }).catch(error => {
      console.log(error)
      job.fail({ error })
    })
  }
)
