//import SimpleSchema from 'simpl-schema';

Genes = new Mongo.Collection('genes');

//create a base schema
IntervalBaseSchema = new SimpleSchema({
  ID: {
    type: String,
    unique: true,
    denyUpdate: true,
    label: 'Unique gene ID'
  },
  start: {
    type: SimpleSchema.Integer,
    label: 'Start coordinate'
  },
  end: {
    type: SimpleSchema.Integer,
    label: 'End coordinate'
  },
  score: {
    type: Number,
    label: 'Score'
  },
  attributes: {
    type: Object,
    blackbox: true,
    label: 'Any attributes'
  }  
});


//extend the base schema for subfeatures like exon,CDS,mRNA
//do this first so we can then add it to the gene schema
SubfeatureSchema = new SimpleSchema([IntervalBaseSchema,{
  phase: {
    type: SimpleSchema.Integer,
    allowedValues: [0,1,2,'.'],
    label: 'phase'
  },
  type: {
    type: String,
    allowedValues: ['CDS','exon','mRNA'],
    label: 'Subfeature types'
  },
  children: {
    type: [String],
    label: 'Child subfeatures'
  },
  parents: {
    type: [String],
    label: 'Parent subfeatures'
  }
}])

//extend the base schema for gene features
GeneSchema = new SimpleSchema([IntervalBaseSchema,{
  editing: {
    type: String,
    optional: true
  },
  viewing: {
    type: [String],
    optional: true
  },
  experiments: {
    type: [Object],
    blackbox: true,
    optional: true,
    label: 'Transcriptome counts and TPM'
  },
  subfeatures: {
    type: [SubfeatureSchema],
    blackbox: true,
    label: 'Array of subfeatures'
  },
  assembly: { // this should probable be renamed to 'reference'
    type: String,
    denyUpdate: true,
    label: 'Reference genome'
  },
  seqid: {
    type: String,
    denyUpdate: true,
    label: 'ID of the sequence on which the gene is, e.g. chr1'
  },
  source: {
    type: String,
    label: 'Source of the annotation'
  },
  type: {
    type: String,
    allowedValues: ['gene'],
    label: 'Type of the top level annotation, currently only "gene" is allowed'
  },
  strand: {
    type: String,
    allowedValues: ['+', '-'],
    label: 'Strand'
  },
  track: {
    type: String,
    label: 'Name of this annotation track'
  }
}])

Genes.attachSchema(GeneSchema);

Genomes = new Mongo.Collection('genomes');
Tracks = new Mongo.Collection('tracks');
Interpro = new Mongo.Collection('interpro');
Orthogroups = new Mongo.Collection('orthogroups');
Experiments = new Mongo.Collection('experiments');
FilterOptions = new Mongo.Collection('filterOptions');
Downloads = new Mongo.Collection('downloads');
EditHistory = new Mongo.Collection('editHistory');
