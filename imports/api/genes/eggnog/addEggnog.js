import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';
import { eggnogCollection } from '/imports/api/genes/eggnog/eggnogCollection.js';

class EggnogProcessor {
  constructor() {
    // Not a bulk mongo suite.
    this.genesDb = Genes.rawCollection();
  }

  parse = (line) => {
    if (!(line[0] === '#' || line.split('\t').length <= 1)) {

      // Get all eggnog informations line by line and separated by tabs.
      const [ query_name, seed_eggNOG_ortholog, seed_ortholog_evalue,
        seed_ortholog_score, eggNOG_OGs, max_annot_lvl, cog_category,
        description, preferred_name, gos, ec, kegg_ko, kegg_Pathway,
        kegg_Module, kegg_Reaction, kegg_rclass, brite, kegg_TC, cazy,
        biGG_Reaction, pfams, ] = line.split('\t');

      // Organize data in a dictionary.
      const annotations= {
        'query_name': query_name,
        'seed_eggNOG_ortholog': seed_eggNOG_ortholog,
        'seed_ortholog_evalue': seed_ortholog_evalue,
        'seed_ortholog_score': seed_ortholog_score,
        'eggNOG_OGs': eggNOG_OGs,
        'max_annot_lvl': max_annot_lvl,
        'COG_category': cog_category,
        'Description': description,
        'Preferred_name': preferred_name,
        'GOs': gos,
        'EC': ec,
        'KEGG_ko': kegg_ko,
        'KEGG_Pathway': kegg_Pathway,
        'KEGG_Module': kegg_Module,
        'KEGG_Reaction': kegg_Reaction,
        'KEGG_rclass': kegg_rclass,
        'BRITE': brite,
        'KEGG_TC': kegg_TC,
        'CAZy': cazy,
        'BiGG_Reaction': biGG_Reaction,
        'PFAMs': pfams
      }

      // Filters undefined data (with a dash) and splits into an array for
      // comma-separated data.
      for (const [key, value] of Object.entries(annotations)) {
        if (value[0] === '-') {
          annotations[key] = ' ';
        }
        if( value.indexOf(',') > -1 ) {
          annotations[key] = value.split(',');
        }
      }

      // If subfeatures is found in genes database (e.g: ID =
      // MMUCEDO_000002-T1).
      const subfeatureIsFound = this.genesDb.findOne(
        { 'subfeatures.ID': query_name }
      );


      if (typeof subfeatureIsFound !== 'undefined') {

        // Update or insert if no matching documents were found.
        const documentEggnog = eggnogCollection.upsert(
          { 'query_name': query_name }, // selector.
          annotations, // modifier.
        );

        // Update eggnogId in genes database only if a new eggnog document is
        // created (and not updated).
        if (typeof documentEggnog.insertedId !== 'undefined') {
          this.genesDb.update(
            { 'subfeatures.ID': query_name },
            { $set: { eggnogId: documentEggnog.insertedId } }
          );
        }

      } else {
        logger.warn(`
Warning ! ${query_name} eggnog annotation did
not find a matching protein domain in the genes database.
${query_name} is not added to the eggnog database.`);
      }
    }
  }
}

const addEggnog = new ValidatedMethod({
  name: 'addEggnog',
  validate: new SimpleSchema({
    fileName: { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ fileName }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    console.log("file :", { fileName });
    const job = new Job(jobQueue, 'addEggnog', { fileName });
    const jobId = job.priority('high').save();

    let { status } = job.doc;
    logger.debug(`Job status: ${status}`);
    while (status !== 'completed') {
      const { doc } = job.refresh();
      status = doc.status;
    }

    return { result: job.doc.result };
  },
});

export default addEggnog;
export { EggnogProcessor };
