import SimpleSchema from 'simpl-schema';

const eggnogSchema = new SimpleSchema({
  query_name: {
    type: String,
    label: 'Query sequence name',
  },
  seed_eggNOG_ortholog: {
    type: String,
    label: 'Best protein match in eggNOG',
  },
  seed_ortholog_evalue: {
    type: String,
    label: 'best protein match (e-value)',
  },
  seed_ortholog_score: {
    type: String,
    label: 'Best protein match (bit-score)',
  },
  eggNOG_OGs: {
    type: String,
    label: 'List of Orthologous Groups (OGs) identified for this query',
  },
  max_annot_lvl: {
    type: String,
    label: 'The level of widest OG used to retrieve orthologs for annotations'
  },
  COG_category: {
    type: String,
    label: 'COG category of the narrowest OG with a valid one.',
  },
  Description: {
    type: String,
    label: 'Description of the narrowest OG with a valid one.',
  },
  Preferred_name: {
    type: String,
  },
  GOs: {
    type: Array,
    label: 'Comma delimited list of predicted Gene Ontology terms',
  },
  'GOs.$': {
    type: String,
  },
  EC: {
    type: Array,
  },
  'EC.$': {
    type: String,
  },
  KEGG_ko: {
    type: Array,
  },
  'KEGG_ko.$': {
    type: String,
  },
  KEGG_Pathway: {
    type: Array,
  },
  'KEGG_Pathway.$': {
    type: String,
  },
  KEGG_Module: {
    type: Array,
  },
  'KEGG_Module.$': {
    type: String,
  },
  KEGG_Reaction: {
    type: Array,
  },
  'KEGG_Reaction.$': {
    type: String,
  },
  KEGG_rclass: {
    type: Array,
  },
  'KEGG_rclass.$': {
    type: String,
  },
  BRITE: {
    type: Array,
  },
  'BRITE.$': {
    type: String,
  },
  KEGG_TC: {
    type: Array,
  },
  'KEGG_TC.$': {
    type: String,
  },
  CAZy: {
    type: Array,
  },
  'CAZy.$': {
    type: String,
  },
  BiGG_Reaction: {
    type: Array,
  },
  'BiGG_Reaction.$': {
    type: String,
  },
  PFAMs: {
    type: Array,
  },
  'PFAMs.$': {
    type: String,
  },
  md5: {
    type: String,
    optional: true,
  },
});

export { eggnogSchema };
