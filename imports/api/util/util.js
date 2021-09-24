/* eslint-disable no-param-reassign, no-case-declarations */
import logger from '/imports/api/util/logger.js';

const DBXREF_REGEX = {
  go: /^(GO:[0-9]{7})$/,
  interpro: /^(InterPro:IPR[0-9]{6})$/,
};

DBXREF_REGEX.combined = new RegExp(
  Object.values(DBXREF_REGEX)
    .map((val) => val.source)
    .join('|'),
);

/**
 * Parse gff3 attribute column into key:value object.
 * @param  {String} attributeString Raw gff3 attribute column string
 * @return {Object}                 Key:value pairs of attributes.
 */
const parseAttributeString = (attributeString) => attributeString.split(';').reduce((attributes, stringPart) => {
  const [key, value] = stringPart.split('=');
  if (typeof key !== 'undefined' && typeof value !== 'undefined') {
    attributes[key] = value
      .split('"')
      .join('')
      .split(',')
      .map(decodeURIComponent);
  }
  return attributes;
}, {});

/**
 * Debug parsing gff3 attribute column by logging intermediate steps to logger
 * @param  {String} attributeString Raw gff3 attribute column string
 * @return {Object}                 Key:value pairs of attributes.
 */
const debugParseAttributeString = (attributeString) => {
  const arr = attributeString.split(';');
  logger.debug(arr);
  const attributes = arr.reduce((attr, stringPart) => {
    const [key, value] = stringPart.split('=');
    logger.debug(key, value);
    const values = value
      .split('"')
      .join('')
      .split(',')
      .map(decodeURIComponent);
    logger.debug(values);
    attr[key] = values;
    return attr;
  }, {});
  logger.debug(attributes);
  return attributes;
};

/**
 * Reverse complement a DNA string
 * @param  {String} seq String representing DNA constisting of alphabet AaCcGgTtNn
 * @return {String}     String representing DNA: reverse complement of input
 */
const reverseComplement = (seq) => {
  const comp = {
    A: 'T',
    T: 'A',
    C: 'G',
    G: 'C',
    N: 'N',
    a: 't',
    t: 'a',
    c: 'g',
    g: 'c',
    n: 'n',
  };
  const seqArray = seq.split('');
  const revSeqArray = seqArray.reverse();
  const revCompSeqArray = revSeqArray.map((nuc) => comp[nuc]);
  const revCompSeq = revCompSeqArray.join('');
  return revCompSeq;
};

/**
 * Convert a DNA string into a amino acid string
 * @param  {String} seq String representing DNA constisting of alphabet ACGTN
 * @return {String}     String representing the amino acid complement of input string
 */
export const translate = (seq) => {
  const trans = {
    ACC: 'T',
    ACA: 'T',
    ACG: 'T',
    AGG: 'R',
    AGC: 'S',
    GTA: 'V',
    AGA: 'R',
    ACT: 'T',
    GTG: 'V',
    AGT: 'S',
    CCA: 'P',
    CCC: 'P',
    GGT: 'G',
    CGA: 'R',
    CGC: 'R',
    TAT: 'Y',
    CGG: 'R',
    CCT: 'P',
    GGG: 'G',
    GGA: 'G',
    GGC: 'G',
    TAA: '*',
    TAC: 'Y',
    CGT: 'R',
    TAG: '*',
    ATA: 'I',
    CTT: 'L',
    ATG: 'M',
    CTG: 'L',
    ATT: 'I',
    CTA: 'L',
    TTT: 'F',
    GAA: 'E',
    TTG: 'L',
    TTA: 'L',
    TTC: 'F',
    GTC: 'V',
    AAG: 'K',
    AAA: 'K',
    AAC: 'N',
    ATC: 'I',
    CAT: 'H',
    AAT: 'N',
    GTT: 'V',
    CAC: 'H',
    CAA: 'Q',
    CAG: 'Q',
    CCG: 'P',
    TCT: 'S',
    TGC: 'C',
    TGA: '*',
    TGG: 'W',
    TCG: 'S',
    TCC: 'S',
    TCA: 'S',
    GAG: 'E',
    GAC: 'D',
    TGT: 'C',
    GCA: 'A',
    GCC: 'A',
    GCG: 'A',
    GCT: 'A',
    CTC: 'L',
    GAT: 'D',
  };
  const codonArray = seq.match(/.{1,3}/g);
  const pepArray = codonArray.map((codon) => {
    const aminoAcid = codon.indexOf('N') < 0 ? trans[codon] : 'X';
    return aminoAcid;
  });
  const pep = pepArray.join('');
  return pep;
};

/**
 * Get nucleotide and protein sequences of all transcripts for a single gene (using CDS subfeatures)
 * @param  {Object} gene Object representing a gene-model
 * @return {Array}     Array with objects, where each object has a transcriptId,
 *                        nucleotide sequence and protein sequence field
 */
const getGeneSequences = (gene) => {
  const transcripts = gene.subfeatures.filter((subfeature) => subfeature.type === 'mRNA');
  const sequences = transcripts.map((transcript) => {
    const cdsArray = gene.subfeatures
      .filter(
        (subfeature) => subfeature.parents.indexOf(transcript.ID) >= 0 && subfeature.type === 'CDS',
      )
      .sort((a, b) => a.start - b.start);

    const rawSeq = cdsArray.map((cds) => cds.seq).join('');

    const forward = gene.strand === '+';
    const phase = forward ? cdsArray[0].phase : cdsArray[cdsArray.length - 1].phase;
    const transcriptSeq = forward ? rawSeq : reverseComplement(rawSeq);

    const isPhased = phase === 1 || phase === 2;
    const codingSeq = isPhased ? transcriptSeq.slice(phase) : transcriptSeq;

    const codingPep = translate(codingSeq.toUpperCase());

    return {
      ID: transcript.ID,
      nucl: codingSeq,
      prot: codingPep,
    };
  });
  return sequences;
};

const parseNewick = (newickString) => {
  // Adapted from Jason Davies https://github.com/jasondavies/newick.js
  const ancestors = [];
  const tokens = newickString.split(/\s*(;|\(|\)|,|:)\s*/);
  const geneIds = [];
  let tree = {};
  let subtree = {};
  let nNodes = 0;
  tokens.forEach((token, tokenIndex) => {
    switch (token) {
      case '(': // new subtree (children of current tree)
        subtree = {};
        tree.children = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': // another branch
        subtree = {};
        ancestors[ancestors.length - 1].children.push(subtree);
        tree = subtree;
        break;
      case ')': // optional name next
        tree = ancestors.pop();
        break;
      case ':': // optional length next
        break;
      default:
        const previousToken = tokens[tokenIndex - 1];
        if (previousToken === '(' || previousToken === ')' || previousToken === ',') {
          tree.name = token;
          nNodes += 1;
          if (token.length > 0) {
            geneIds.push(token);
          }
        } else if (previousToken === ':') {
          tree.branchLength = parseFloat(token);
        }
    }
  });
  return {
    tree,
    geneIds,
    size: 0.5 * (nNodes + 1), // geneIds.length
  };
};

export {
  DBXREF_REGEX, parseAttributeString, debugParseAttributeString,
  reverseComplement, getGeneSequences, parseNewick,
};
