import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { MongoInternals } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';
import glob from 'glob';
import fs from 'fs';

import { orthogroupCollection, orthogroupSchema } from
  '/imports/api/genes/orthogroup_collection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { parseNewick } from '/imports/api/util/util.js';
import logger from '/imports/api/util/logger.js';

function globPromise(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function addOrthogroupTree({ fileName, session }) {
  // Turn filename into orthogroup ID
  const orthogroupId = fileName.split('/').pop().split('_')[0];

  // Parse newick formatted treefile
  const treeNewick = fs.readFileSync(fileName, 'utf8');
  const { size, geneIds } = parseNewick(treeNewick);

  logger.debug({ treeNewick });

  // Set up data to insert
  const orthogroupData = {
    ID: orthogroupId,
    size,
    tree: treeNewick,
    geneIds,
  };

  // Validate data against orthogroup schema
  // this throws an error for invalid data
  await orthogroupSchema.validate(orthogroupData);

  // Insert orthogroup data
  await orthogroupCollection.rawCollection()
    .insert(orthogroupData, { session });

  // Find genes belonging to orthogroup
  const orthogroupGenes = await Genes.rawCollection()
    .find(
      {
        $or: [
          { ID: { $in: geneIds } },
          { 'subfeatures.ID': { $in: geneIds } },
        ],
      },
      { session },
    )
    .toArray();

  const orthogroupGeneIds = orthogroupGenes.map(({ ID }) => ID);
  if (orthogroupGeneIds.size === 0) {
    logger.warn(
      `Orthogroup ${orthogroupId} consists exclusively of genes \
      not in the database`,
    );
  }

  // Update genes in orthogroups with orthogroup ID
  await Genes.rawCollection().update(
    { ID: { $in: orthogroupGeneIds } }, // query
    { $set: { orthogroupId } }, // changes
    { multi: true, session }, // options
  );
  return orthogroupGeneIds.length;
}

const addOrthogroupTrees = new ValidatedMethod({
  name: 'addOrthogroupTrees',
  validate: new SimpleSchema({
    folderName: { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  async run({ folderName }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }
    logger.log('addOrthogroupTrees', folderName);

    // First set up a mongo transaction
    // data will only be added at the end of the transaction
    const { client } = MongoInternals.defaultRemoteCollectionDriver().mongo;
    const session = client.startSession();
    await session.startTransaction();

    const res = globPromise(`${folderName}/*`)
      .then(async (fileNames) => {
        try {
          // Iterate over all files in the folder
          const results = await Promise.all(
            fileNames.map(
              async (fileName) => addOrthogroupTree({ fileName, session }),
            ),
          );
          // If no error commit all changes
          await session.commitTransaction();
          const nOrthogroups = results.length;
          const nGenes = results.reduce((a, b) => a + b, 0); // sum using reduce
          return { nOrthogroups, nGenes };
        } catch (err) {
          // If something went wrong discard all changes
          await session.abortTransaction();
          throw new Meteor.Error(err);
        } finally {
          // Always close the session
          await session.endSession();
        }
      });
    return res;
  },
});

export default addOrthogroupTrees;
