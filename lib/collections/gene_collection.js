//import SimpleSchema from '@clayne/simple-schema';

Genes = new Mongo.Collection('genes');

//create a base schema
IntervalBaseSchema = new SimpleSchema({
  ID: {
    type: String,
    unique: true,
    denyUpdate: true,
    label: 'Unique gene ID'
  },
  type: {
    type: String,
    allowedValues: ['gene','mRNA','CDS','exon','three_prime_UTR','five_prime_UTR'],
    label: 'Interval type'
  },
  start: {
    type: Number,
    label: 'Start coordinate'
  },
  end: {
    type: Number,
    label: 'End coordinate'
  },
  score: {
    type: String,
    label: 'Score',
    custom: function(){
      if (!this.isSet){
        return 'required'
      }
      if (this.value === '.'){
        return true
      } else {
        let parsedValue = parseFloat(this.value);
        if (isNaN(parsedValue)){
          return 'scoreError'
        } else {
          return true
        }
      }
    }
  },
  attributes: {
    type: Object,
    blackbox: true,
    label: 'Any attributes'
  },
  children: {
    type: [String],
    optional: true,
    label: 'Child subfeatures'
  }  
});

IntervalBaseSchema.messages({
  'scoreError': '[label] must be either "." or a Number'
})

//extend the base schema for subfeatures like exon,CDS,mRNA
//do this first so we can then add it to the gene schema
SubfeatureSchema = new SimpleSchema([IntervalBaseSchema,{
//SubfeatureSchame = IntervalBaseSchema.extend({
  phase: {
    type: SimpleSchema.Integer,
    allowedValues: [0,1,2,'.'],
    label: 'phase'
  },
  type: {
    type: String,
    allowedValues: ['CDS','exon','mRNA','five_prime_UTR','three_prime_UTR'],
    label: 'Subfeature types'
  },
  parents: {
    type: [String],
    label: 'Parent subfeatures'
  }
//})
}])

//extend the base schema for gene features
GeneSchema = new SimpleSchema([IntervalBaseSchema,{
//GeneSchema = IntervalBaseSchema.extend({
  type: {
    type: String,
    allowedValues: ['gene'],
    label: 'Gene type'
  },
  editing: {
    type: String,
    optional: true
  },
  viewing: {
    type: [String],
    optional: true
  },
  changed: {
    type: Boolean,
    optional: true
  },
  expression: {
    type: [Object],
    blackbox: true,
    optional: true,
    label: 'Transcriptome counts and TPM'
  },
  subfeatures: {
    type: [SubfeatureSchema],
    blackbox: true,
    optional: true,
    label: 'Array of subfeatures'
  },
  reference: { 
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
    label: 'Type of the top level annotation (currently only "gene" is allowed)'
  },
  strand: {
    type: String,
    allowedValues: ['+', '-'],
    label: 'Strand'
  },
  track: {
    type: String,
    label: 'Track name'
  },
  permissions: {
    type: [String],
    label: 'Permission level'
  },
  interproscan: {
    type: Object,
    blackbox: true,
    label: 'Interproscan annotation'
  }
//})
}])

Genes.attachSchema(GeneSchema);