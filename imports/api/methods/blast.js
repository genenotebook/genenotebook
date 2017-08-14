import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { spawn } from 'child_process';
import SimpleSchema from 'simpl-schema';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';

import { getGeneSequences } from '/imports/api/util/util.js';

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

    console.log(this.isSimulation)

    if ( !this.isSimulation ){
      //this.unblock();
      const dbtypes = {
        nucleotide: 'nucl',
        protein: 'prot'
      }


      const genes = Genes.find({ track: trackName }).fetch().map(gene => getGeneSequences(gene))

      let fasta = {
        nucleotide: '',
        protein: ''
      }

      genes.forEach(gene => {
        gene.forEach(transcript => {
          let header = `>${transcript.transcriptId}\n`
          fasta.protein += `>${transcript.transcriptId}\n${transcript.pep}\n`
          fasta.nucleotide += `>${transcript.transcriptId}\n${transcript.seq}\n`
        })
      })

      Object.keys(dbtypes).forEach( (dbtype) => {
        const outFile = `${trackName}.${dbtype}`
        const options = ['-dbtype', dbtypes[dbtype], '-title', trackName, '-out', outFile];
        console.log(options)
        const child = spawn('makeblastdb',options);
        
        child.stdin.setEncoding('utf8');
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        
        child.stdin.write(fasta[dbtype]);
        
        child.stdin.end();
        
        let out = ''
        child.stdout.on('data', function (data) {
            out += data;
        });
        let err = ''
        child.stderr.on('data',function(data){
          err += data;
        })

        if (err){
          console.log(`ERROR:\n${err}`)
        }

        child.on('close',function(code){
          console.log(`makeblastdb exit code: ${code}`)
          console.log(out)
        })

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
      })
    }
  }
})

export const blast = new ValidatedMethod({
  name: 'blast',
  validate: new SimpleSchema({
    blastType: { type: String },
    input: { type: String },
    trackNames: { type: Array }
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
          'blastdbs': 1
        }
      }).fetch();

      const dbs = tracks.map(track => { 
        return track.blastdbs[dbType]
      }).join(' ')

      console.log(dbs)
    }
  }
})
/**
 * Spin up a child process to run blast
 * @param  {[type]}
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
/*
blast (blastType,query,trackNames){
  if (! this.userId) {
    throw new Meteor.Error('not-authorized');
  }
  if (! Roles.userIsInRole(this.userId,'curator')){
    throw new Meteor.Error('not-authorized');
  }
  this.unblock();
  const fut = new Future();
  
  const dbType = DB_TYPES[blastType]
  
  const tracks = Tracks.find({'trackName':{$in:trackNames} },{fields:{'blastdbs':1}}).fetch();
  
  const dbs = tracks.map(function(track){return track.blastdbs[dbType]}).join(' ')
  
  console.log(dbs)

  const child = spawn(blastType,['-db',dbs,'-outfmt','5','-num_alignments','20'])
  
  child.stdin.setEncoding('utf8')
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  
  child.stdin.write(query)
  
  let out = ''
  let err = ''
  child.stdout.on('data',function(data){
    out += data;
  })

  child.stderr.on('data',function(data){
    err += data;
  })

  if (err){
    console.log(err);
  }

  if (out){
    console.log(out);
  }

  const o = child.on('close',function(code){
    console.log('exit code: ' + code)
    json_out = xml2js.parseString(out,function(err,res){
      fut.return(res)
    });
  })

  child.stdin.end()
  return fut.wait()
}

*/