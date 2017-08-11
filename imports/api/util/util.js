import { References } from '/imports/api/genomes/reference_collection.js';

/**
 * Reverse complement a DNA string
 * @param  {[String]} seq [String representing DNA constisting of alphabet AaCcGgTtNn]
 * @return {[String]}     [String representing DNA constisting of alphabet AaCcGgTtNn, reverse complement of input]
 */
const reverseComplement = (seq) => {
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

/**
 * Convert a DNA string into a amino acid string
 * @param  {[String]} seq [String representing DNA constisting of alphabet ACGTN]
 * @return {[String]}     [String representing the amino acid complement of input string]
 */
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

/**
 * Get nucleotide and protein sequences of all transcripts for a gene (using CDS subfeatures)
 * @param  {[Object]} gene [Object representing a gene-model]
 * @return {[Array]}     [Array with objects, where each object has a transcriptId, 
 *                        nucleotide sequence and protein sequence field]
 */
const getGeneSequences = (gene) => {
  const transcripts = gene.subfeatures.filter( (subfeature) => { 
    return subfeature.type === 'mRNA' 
  })

  //find all reference fragments overlapping the gene feature
  const referenceArray = References.find({ 
    header: gene.seqid, 
    $and: [ 
      { start: {$lte: gene.end} }, 
      { end: {$gte: gene.start} }
    ] 
  }).fetch()

  let refStart = 10e99;
  const referenceSequence = referenceArray.sort( (a,b) => {
    //sort on start coordinate
    return a.start - b.start
  }).map( (ref) => {
    //find starting position of first reference fragment
    refStart = Math.min(refStart,ref.start)
    return ref.seq
  }).join('')

  const sequences = transcripts.map((transcript) => {
    let cdsArray = gene.subfeatures.filter( (subfeature) => { 
      return subfeature.parents.indexOf(transcript.ID) >= 0 && subfeature.type === 'CDS'
    }).sort( (a,b) => {
      //sort CDS subfeatures on start position
      return a.start - b.start
    })

    let transcriptSeq = cdsArray.map( (cds, index) => {
      let start = cds.start - refStart - 1;
      let end = cds.end - refStart;
      return referenceSequence.slice(start,end)
    }).join('')

    let phase;
    if (this.strand === '-'){
      transcriptSeq = reverseComplement(transcriptSeq)
      phase = cdsArray[cdsArray.length -1].phase
    } else {
      phase = cdsArray[0].phase
    }
 
    if ([1,2].indexOf(phase) >= 0){
      transcriptSeq = transcriptSeq.slice(phase)
    }

    let transcriptPep = translate(transcriptSeq.toUpperCase());

    return {
      ID: transcript.ID,
      seq: transcriptSeq,
      pep: transcriptPep
    }
  })
  return sequences
}

export { reverseComplement, translate, getGeneSequences };


