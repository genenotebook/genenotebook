/*import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import request from 'request';
import Future from 'fibers/future';

import { getGeneSequences } from '/imports/api/util/util.js';

import { Genes } from '/imports/api/genes/gene_collection.js'; 

const revcomp = (seq) => {
  const comp = {  
    'A':'T','a':'t',
    'T':'A','t':'a',
    'C':'G','c':'g',
    'G':'C','g':'c',
    'N':'N','n':'n'
  }
  const revSeqArray = seq.split('').reverse()
  const revCompSeqArray = revSeqArray.map( (nuc) => {
    return comp[nuc]
  })
  const revCompSeq = revCompSeqArray.join('')
  return revCompSeq
}


const translate = (seq) => {
  const trans = {
    'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AGG': 'R', 'AGC': 'S', 'GTA': 'V',
    'AGA': 'R', 'ACT': 'T', 'GTG': 'V',
    'AGT': 'S', 'CCA': 'P', 'CCC': 'P',
    'GGT': 'G', 'CGA': 'R', 'CGC': 'R',
    'TAT': 'Y', 'CGG': 'R', 'CCT': 'P',
    'GGG': 'G', 'GGA': 'G', 'GGC': 'G',
    'TAA': '*', 'TAC': 'Y', 'CGT': 'R',
    'TAG': '*', 'ATA': 'I', 'CTT': 'L',
    'ATG': 'M', 'CTG': 'L', 'ATT': 'I',
    'CTA': 'L', 'TTT': 'F', 'GAA': 'E',
    'TTG': 'L', 'TTA': 'L', 'TTC': 'F',
    'GTC': 'V', 'AAG': 'K', 'AAA': 'K',
    'AAC': 'N', 'ATC': 'I', 'CAT': 'H',
    'AAT': 'N', 'GTT': 'V', 'CAC': 'H',
    'CAA': 'Q', 'CAG': 'Q', 'CCG': 'P',
    'TCT': 'S', 'TGC': 'C', 'TGA': '*',
    'TGG': 'W', 'TCG': 'S', 'TCC': 'S',
    'TCA': 'S', 'GAG': 'E', 'GAC': 'D',
    'TGT': 'C', 'GCA': 'A', 'GCC': 'A',
    'GCG': 'A', 'GCT': 'A', 'CTC': 'L',
    'GAT': 'D'}
  const codonArray = seq.match(/.{1,3}/g)
  const pepArray = codonArray.map( (codon) => {
    let aminoAcid = 'X'
    if (codon.indexOf('N') < 0){
      aminoAcid = trans[codon]
    }
    return aminoAcid
  })
  const pep = pepArray.join('')
  return pep
}

const makeFasta = (gene) => {
  let transcripts = gene.subfeatures.filter( (subfeature) => { return subfeature.type === 'mRNA' })
  let sequences = transcripts.map( (transcript) => {
    let transcriptSeq = `>${transcript.ID}\n`;
    let transcriptPep = `>${transcript.ID}\n`;
    let cdsArray = gene.subfeatures.filter( (sub) => { 
      return sub.parents.indexOf(transcript.ID) >= 0 && sub.type === 'CDS'
    }).sort( (a,b) => {
      return a.start - b.start
    })

    let refStart = 10e99;
    //let referenceSubscription = Meteor.subscribe('references',gene.seqid)
    
    //find all reference fragments overlapping the mRNA feature
    let referenceArray = References.find({ 
      header: gene.seqid, 
      $and: [ 
        { start: {$lte: gene.end} }, 
        { end: {$gte: gene.start} }
      ] 
    }).fetch()

    if (referenceArray.length){
      let reference = referenceArray.sort( (a,b) => {
        //sort on start coordinate
        return a.start - b.start
      }).map( (ref) => {
        //find starting position of first reference fragment
        refStart = Math.min(refStart,ref.start)
        return ref.seq
      }).join('')

      seq = cdsArray.map( (cds, index) => {
        let start = cds.start - refStart - 1;
        let end = cds.end - refStart;
        return reference.slice(start,end)
      }).join('')

      let phase;
      if (this.strand === '-'){
        seq = revcomp(seq)
        phase = cdsArray[cdsArray.length -1].phase
      } else {
        phase = cdsArray[0].phase
      }
   
      if ([1,2].indexOf(phase) >= 0){
        seq = seq.slice(phase)
      }

      let pep = translate(seq.toUpperCase());

      transcriptSeq += seq;
      
      transcriptPep += pep;
      transcriptPep = transcriptPep.split('*').join('X')
    }
    return {ID:transcript.ID, seq: transcriptSeq, pep: transcriptPep}
  })
  return sequences
}

function submitInterpro(sequenceId,peptide){
  const submitJob = new Future();

  request.post({
    url: 'http://www.ebi.ac.uk/Tools/services/rest/iprscan5/run/',
    form: {
      email: 'rens.holmer@gmail.com',
      title: `genebook protein ${sequenceId}`,
      sequence: peptide
    }
  }, (error, response, jobId) => {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    console.log('requestId:', jobId);
    submitJob.return(jobId)
  })

  const jobId = submitJob.wait()

  return jobId
}

function pollInterpro(jobId,cb){
  const statusRequest = new Future();
  const url = `http://www.ebi.ac.uk/Tools/services/rest/iprscan5/status/${jobId}`;
  console.log(`Trying ${url}`)
  request.get(url, (error,response,body) => {
    console.log(error)
    console.log(body)
    statusRequest.return(body)
  })
  const status = statusRequest.wait()
  if (status === 'RUNNING'){
    //figure out a way to call the function with a parameter
    Meteor.setTimeout(function(){return pollInterpro(jobId,cb)}, 100000)
  } else {
    cb(status)
  }
}

function getInterproResults(jobId){
  const future = new Future();
  const url = `http://www.ebi.ac.uk/Tools/services/rest/iprscan5/result/${jobId}/json`
  console.log(`Trying ${url}`)
  request.get(url, (error,response,body) => {
    let interproAnnotation = JSON.parse(body)
    future.return(interproAnnotation)
  })
  const results = future.wait()
  return results
}

Meteor.methods({
  interproscan(geneId){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    //this.unblock();
    const gene = Genes.findOne({ID: geneId})
    const sequences = getGeneSequences(gene)
    const results = sequences.map((sequence) => { 

      // interproscan does not like stop codons, just replace all with X
      let pep = sequence.pep.split('*').join('X')

      const jobId = submitInterpro(sequence.ID, pep);

      const fut = new Future();
      pollInterpro(jobId, (status) => {
        console.log(`pollInterpro: ${status}`)
        fut.return(status)
      })

      const finished = fut.wait();
      
      let results;

      if (finished === 'FINISHED'){
        results = getInterproResults(jobId)
        console.log(results)
        Genes.update({'subfeatures.ID':sequence.ID},{$set:{interproscan:results[0].matches}})
      } 

      return results
    })
    

    return results
  }
})
*/