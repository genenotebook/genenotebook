import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { spawn } from 'child-process-promise';//'child_process';
import SimpleSchema from 'simpl-schema';
import xml2js from 'xml2js-es6-promise';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';

import { getGeneSequences, getMultipleGeneSequences } from '/imports/api/util/util.js';

/**
 * Keep track of what blast commands should use which databases
 * @type {Object}
 */
const DB_TYPES = {  
  'blastn':'nucl',
  'tblastn':'nucl',
  'tblastx':'nucl',
  'blastp':'prot',
  'blastx':'prot'
}

export const makeBlastDb = new ValidatedMethod({
  name: 'makeBlastDb',
  validate: new SimpleSchema({
    trackName: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackName }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole( this.userId, 'admin' )){
      throw new Meteor.Error('not-authorized');
    }

    console.log('makeBlastDb',trackName)

    if ( !this.isSimulation ){

      this.unblock()

      console.log('fetching sequences')
      //const _genes = Genes.find({ track: trackName }).fetch();

      //getMultipleGeneSequences(_genes)

      const genes = Genes.find({ track: trackName }).map(gene => getGeneSequences(gene))

      return 
      let fasta = {
        nucl: '',
        prot: ''
      }

      
      genes.forEach(gene => {
        gene.forEach(transcript => {
          let header = `>${transcript.transcriptId}\n`
          fasta.prot += `>${transcript.transcriptId}\n${transcript.pep}\n`
          fasta.nucl += `>${transcript.transcriptId}\n${transcript.seq}\n`
        })
      })
      
      console.log('making db')
      //let promises = Object.keys(fasta).map( (dbtype) => {
      let promises = ['nucl'].map( (dbtype) => {
        let outFile = `${trackName}.${dbtype}`
        let options = ['-dbtype', dbtype, '-title', trackName, '-out', outFile];
        console.log(options)
        let promise = spawn('makeblastdb', options, { capture: ['stdout', 'stderr'] })
          .progress( childProcess => {
            let stdin = childProcess.stdin;
            stdin.setEncoding('utf8')
            console.log('start writing to stdin')
            stdin.end(fasta[dbtype], ()=>{
              console.log('closed stdin')
            })
          })
          .then( result => {
            let stdout = result.stdout.toString();
            let stderr = result.stderr.toString();
            if (stdout){
              console.log(`makeblastdb stdout:${stdout}`)
            }
            if (stderr){
              console.error(`makeblastdb stderr:${stderr}`)
              throw new Meteor.Error('makeblastdb error')
            }
            Tracks.findAndModify({
              query: {
                trackName: trackName 
              },
              update: { 
                $set: {
                  [`blastdbs.${dbtype}`]: `${trackName}.${dbtype}` 
                }
              } 
            })
            return `${trackName}.${dbtype}` 
          }).catch(error => {
            console.error(error)
          })
          return promise
      })
      return Promise.all(promises).catch(error => console.error(error))
    }
  }
})

export const blast = new ValidatedMethod({
  name: 'blast',
  validate: new SimpleSchema({
    blastType: { type: String },
    input: { type: String },
    trackNames: { type: Array },
    'trackNames.$': { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ blastType, input, trackNames }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'curator')){
      throw new Meteor.Error('not-authorized');
    }
    
    console.log(blastType,input,trackNames)

    if ( !this.isSimulation ){
      this.unblock();
      const dbType = DB_TYPES[blastType]
  
      const tracks = Tracks.find({
        trackName: {
          $in: trackNames
        } 
      },{
        fields: {
          blastdbs: 1
        }
      }).fetch();

      const dbs = tracks.map(track => { 
        return track.blastdbs[dbType]
      }).join(' ')

      const options = ['-db',dbs,'-outfmt','5','-num_alignments','20']

      return spawn(blastType, options, { capture: ['stdout', 'stderr'] })
        .progress(childProcess => {
          let stdin = childProcess.stdin;
          stdin.setEncoding('utf8');
          stdin.write(input);
          stdin.end();
        })
        .then( result => {
          return xml2js(result.stdout.toString())
        }).then( result => {
          console.log(result)
          return result
        })
    }
  }
})
