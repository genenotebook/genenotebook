import { References } from '/imports/api/genomes/reference_collection.js';

/**
 * Reverse complement a DNA string
 * @param  {[String]} seq [String representing DNA constisting of alphabet AaCcGgTtNn]
 * @return {[String]}     [String representing DNA constisting of alphabet AaCcGgTtNn, reverse complement of input]
 */
export const reverseComplement = (seq) => {
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
export const translate = (seq) => {
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
 * Get nucleotide and protein sequences of all transcripts for a multiple genes (using CDS subfeatures)
 * @param  {[Array]<gene>} genes [Array of Object representing gene-models]
 * @return {[Array]}     [Array with objects, where each object has a transcriptId, 
 *                        nucleotide sequence and protein sequence field]
 */
const getMultipleGeneSequences = (genes) => {
  const seqids = genes.map(gene => {
    return gene.seqid
  })
  const uniqueSeqids = [...new Set(seqids)]

  console.log(uniqueSeqids)

  const refSeqs = uniqueSeqids.reduce((obj,seqid,i) => {
    obj[seqid] = References.find({
      header: seqid
    },{
      sort: { start: 1 }
    }).map(ref => {
      return ref.seq
    }).join('')
    return obj
  },{}); //this part is import, initialize reduce with empty object
  console.log(refSeqs)
}


/**
 * Get nucleotide and protein sequences of all transcripts for a single gene (using CDS subfeatures)
 * @param  {[Object]} gene [Object representing a gene-model]
 * @return {[Array]}     [Array with objects, where each object has a transcriptId, 
 *                        nucleotide sequence and protein sequence field]
 */
export const getGeneSequences = (gene) => {
  //console.log(`getGeneSequences ${gene.ID}`)
  const transcripts = gene.subfeatures.filter( subfeature => { 
    return subfeature.type === 'mRNA' 
  })
  const sequences = transcripts.map( transcript => {
    let cdsArray = gene.subfeatures.filter( subfeature => { 
      return subfeature.parents.indexOf(transcript.ID) >= 0 && subfeature.type === 'CDS'
    }).sort( (a,b) => {
      //sort CDS subfeatures on start position
      return a.start - b.start
    })

    let rawSeq = cdsArray.map( (cds, index) => {
      return cds.seq
    }).join('')

    const forward = gene.strand === '+';
    const phase = forward ? cdsArray[0].phase : cdsArray[cdsArray.length - 1].phase;
    const transcriptSeq = forward ? rawSeq : reverseComplement(rawSeq);

    const isPhased = phase === 1 | phase === 2;
    const codingSeq = isPhased ? transcriptSeq.slice(phase) : transcriptSeq;

    const codingPep = translate(codingSeq.toUpperCase());

    return {
      ID: transcript.ID,
      seq: codingSeq,
      pep: codingPep
    }
  })
  return sequences
}

//export { reverseComplement, translate, getGeneSequences, getMultipleGeneSequences };


