import { References } from '../genomes/reference_collection.js';

/**
 * Format gff3 attribute column into key:value object.
 * @param  {String} attributeString Raw gff3 attribute column string
 * @return {Object}                 Key:value pairs of attributes.
 */
export const formatAttributes = attributeString => {
  return attributeString.split(';').reduce((attributes, stringPart) => {
    const [key, value] = stringPart.split('=')
    if (typeof key !== 'undefined' && typeof value !== 'undefined'){
      attributes[key] = value.split('"').join('').split(',').map(decodeURIComponent)
    }
    return attributes;
  }, {})
}

/**
 * Reverse complement a DNA string
 * @param  {String} seq String representing DNA constisting of alphabet AaCcGgTtNn
 * @return {String}     String representing DNA constisting of alphabet AaCcGgTtNn, reverse complement of input
 */
export const reverseComplement = seq => {
  const comp = {  
    'A':'T','a':'t',
    'T':'A','t':'a',
    'C':'G','c':'g',
    'G':'C','g':'c',
    'N':'N','n':'n'
  }
  const revSeqArray = seq.split('').reverse()
  const revCompSeqArray = revSeqArray.map(nuc => {
    return comp[nuc]
  })
  const revCompSeq = revCompSeqArray.join('')
  return revCompSeq
}

/**
 * Convert a DNA string into a amino acid string
 * @param  {String} seq String representing DNA constisting of alphabet ACGTN
 * @return {String}     String representing the amino acid complement of input string
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
  const pepArray = codonArray.map(codon => {
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
 * @param  {Array<gene>} genes Array of Object representing gene-models
 * @return {Array}     Array with objects, where each object has a transcriptId, 
 *                        nucleotide sequence and protein sequence field
 */
const getMultipleGeneSequences = genes => {
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
 * @param  {Object} gene Object representing a gene-model
 * @return {Array}     Array with objects, where each object has a transcriptId, 
 *                        nucleotide sequence and protein sequence field
 */
export const getGeneSequences = gene => {
  //console.log(`getGeneSequences ${gene.ID}`)
  const transcripts = gene.subfeatures.filter(subfeature => { 
    return subfeature.type === 'mRNA' 
  })
  const sequences = transcripts.map(transcript => {
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
      nucl: codingSeq,
      prot: codingPep
    }
  })
  return sequences
}

export const parseNewick = newickString => {
  //Adapted from Jason Davies https://github.com/jasondavies/newick.js
  const ancestors = [];
  const tokens = newickString.split(/\s*(;|\(|\)|,|:)\s*/);
  const geneIds = []
  let tree = {};
  let subtree = {};
  tokens.forEach((token, tokenIndex) => {
    switch(token){
      case '(': //new branchset
        subtree = {};
        tree.branchset = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': //another branch
        subtree = {};
        ancestors[ancestors.length - 1].branchset.push(subtree);
        tree = subtree;
        break;
      case ')': //optional name next
        tree = ancestors.pop();
        break;
      case ':': //optional length next
        break;
      default:
        let previousToken = tokens[tokenIndex - 1];
        if (
          previousToken === '(' ||
          previousToken === ')' ||
          previousToken === ','
        ){
          tree.name = token;
          const geneId = token.split('.').slice(0,-1).join('.');
          if (geneId.length > 0){
            geneIds.push(geneId)
          }
        } else if (previousToken === ':'){
          tree.branchLength = parseFloat(token);
        }
    }
  })
  return {
    tree: tree,
    geneIds: geneIds,
    size: geneIds.length
  };
}


