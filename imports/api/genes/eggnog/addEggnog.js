import { eggnogCollection } from '/imports/api/genes/eggnog/eggnogCollection.js';
import jobQueue, { Job } from '/imports/api/jobqueue/jobqueue.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

class EggnogProcessor {
  constructor() {
    // Not a bulk mongo suite.
    this.genesDb = Genes.rawCollection();
  }

  parse = (line) => {
    if (!(line[0] === '#' || line.split('\t').length <= 1)) {
      // Get all eggnog informations line by line and separated by tabs.
      const [
        queryName,
        seedEggnogOrtholog,
        seedOrthologEvalue,
        seedOrthologScore,
        eggnogOGs,
        maxAnnotLvl,
        cogCategory,
        description,
        preferredName,
        gos,
        ec,
        keggKo,
        keggPathway,
        keggModule,
        keggReaction,
        keggRclass,
        brite,
        keggTc,
        cazy,
        biggReaction,
        pfams,
      ] = line.split('\t');

      // Organize data in a dictionary.
      const annotations = {
        query_name: queryName,
        seed_eggNOG_ortholog: seedEggnogOrtholog,
        seed_ortholog_evalue: seedOrthologEvalue,
        seed_ortholog_score: seedOrthologScore,
        eggNOG_OGs: eggnogOGs,
        max_annot_lvl: maxAnnotLvl,
        COG_category: cogCategory,
        Description: description,
        Preferred_name: preferredName,
        GOs: gos,
        EC: ec,
        KEGG_ko: keggKo,
        KEGG_Pathway: keggPathway,
        KEGG_Module: keggModule,
        KEGG_Reaction: keggReaction,
        KEGG_rclass: keggRclass,
        BRITE: brite,
        KEGG_TC: keggTc,
        CAZy: cazy,
        BiGG_Reaction: biggReaction,
        PFAMs: pfams,
      };

      // Filters undefined data (with a dash) and splits into an array for
      // comma-separated data.
      for (const [key, value] of Object.entries(annotations)) {
        if (value[0] === '-') {
          annotations[key] = undefined;
        }
        if (value.indexOf(',') > -1) {
          annotations[key] = value.split(',');
        }
      }

      // If subfeatures is found in genes database (e.g: ID =
      // MMUCEDO_000002-T1).
      const subfeatureIsFound = this.genesDb.findOne(
        { 'subfeatures.ID': queryName },
      );

      if (typeof subfeatureIsFound !== 'undefined') {
        // Update or insert if no matching documents were found.
        const documentEggnog = eggnogCollection.upsert(
          { query_name: queryName }, // selector.
          annotations, // modifier.
        );

        // Update eggnogId in genes database.
        if (typeof documentEggnog.insertedId !== 'undefined') {
          // Eggnog _id is created.
          this.genesDb.update(
            { 'subfeatures.ID': queryName },
            { $set: { eggnogId: documentEggnog.insertedId } },
          );
        } else {
          // Eggnog already exists.
          const eggnogIdentifiant = eggnogCollection.findOne({ query_name: queryName })._id;
          this.genesDb.update(
            { 'subfeatures.ID': queryName },
            { $set: { eggnogId: eggnogIdentifiant } },
          );
        }
      } else {
        logger.warn(`
Warning ! ${queryName} eggnog annotation did
not find a matching protein domain in the genes database.
${queryName} is not added to the eggnog database.`);
      }
    }
  };
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

    console.log('file :', { fileName });
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
