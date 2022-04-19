import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';

const eggnogSchema = new SimpleSchema({
  query_name: {
    type: String,
    label: 'Query sequence name.',
  },
  seed_eggNOG_ortholog: {
    type: String,
    label: 'Best protein match in eggNOG.',
  },
  seed_ortholog_evalue: {
    type: String,
    label: 'best protein match (e-value).',
  },
  seed_ortholog_score: {
    type: String,
    label: 'Best protein match (bit-score).',
  },
  eggNOG_OGs: {
    type: String,
    label: 'List of Orthologous Groups (OGs) identified for this query.',
  },
  max_annot_lvl: {
    type: String,
    label: 'The level of widest OG used to retrieve orthologs for annotations.',
  },
  COG_category: {
    type: String,
    label: 'COG functional category inferred from best matching OG.',
  },
  Description: {
    type: String,
    label: 'EggNOG functional description inferred from best matching OG.',
  },
  Preferred_name: {
    type: String,
    label: 'Predicted gene name',
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
    label: 'The Enzyme Commission number (EC number).',
  },
  'EC.$': {
    type: String,
  },
  KEGG_ko: {
    type: Array,
    label: 'Comma delimited list of predicted KEGG KOs.',
  },
  'KEGG_ko.$': {
    type: String,
  },
  KEGG_Pathway: {
    type: Array,
    label: 'Comma delimited list of predicted KEGG Pathways.',
  },
  'KEGG_Pathway.$': {
    type: String,
  },
  KEGG_Module: {
    type: Array,
    label: 'Predicted KEGG Module.',
  },
  'KEGG_Module.$': {
    type: String,
  },
  KEGG_Reaction: {
    type: Array,
    label: 'Predicted KEGG Reaction.',
  },
  'KEGG_Reaction.$': {
    type: String,
  },
  KEGG_rclass: {
    type: Array,
    label: 'Predicted KEGG Reaction Class.',
  },
  'KEGG_rclass.$': {
    type: String,
  },
  BRITE: {
    type: Array,
    label: 'Predicted KEGG BRITE.',
  },
  'BRITE.$': {
    type: String,
  },
  KEGG_TC: {
    type: Array,
    label: 'Predicted KEGG TC.',
  },
  'KEGG_TC.$': {
    type: String,
  },
  CAZy: {
    type: Array,
    label: 'Best hit with Carbohydrate-Active enZYmes Database',
  },
  'CAZy.$': {
    type: String,
  },
  BiGG_Reaction: {
    type: Array,
    label: 'Comma delimited list of predicted BiGG metabolic reactions.',
  },
  'BiGG_Reaction.$': {
    type: String,
  },
  PFAMs: {
    type: Array,
    label: 'Large collection of protein families.',
  },
  'PFAMs.$': {
    type: String,
  },
  md5: {
    type: String,
    label: 'md5 hashes of the annotated sequences.',
    optional: true,
  },
});

const eggnogCollection = new Mongo.Collection('eggnog');

export { eggnogCollection, eggnogSchema };
