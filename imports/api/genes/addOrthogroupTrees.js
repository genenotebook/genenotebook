import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';
import glob from 'glob';

import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { parseNewick } from '/imports/api/util/util.js';
import fs from 'fs';

const globPromise = (pattern, options) => {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

const executeBulkOp = bulkOp => {
  return new Promise ((resolve, reject) => {
    try {
      bulkOpResult = bulkOp.execute();
      resolve(bulkOpResult);
    } catch (error) {
      reject(error)
    }
  })
}

const addOrthogroupTree = ({ fileName, geneBulkOp, orthoBulkOp }) => {
  const orthogroupId = fileName.split('/').pop().split('_')[0];
  
  const treeNewick = fs.readFileSync(fileName, 'utf8');
  const { size, tree, geneIds } = parseNewick(treeNewick);

  console.log(orthogroupId, geneIds);

  orthogroupCollection.insert({
    ID: orthogroupId,
    size,
    tree: treeNewick,
    geneIds
  }, (err, _id) => {
    if (err) {
      throw new Meteor.Error(err);
    }
    Genes.update({
      $or: [
        { ID: { $in: geneIds } },
        { 'subfeatures.ID': { $in: geneIds }}
      ]
      
    },{
      $set: { orthogroupId }
    },{
      multi: true 
    }, (err, nUpdated) => {
      if (err){
        throw new Meteor.Error(err);
      }
    })
  })
}

export const addOrthogroupTrees = new ValidatedMethod({
  name: 'addOrthogroupTrees',
  validate: new SimpleSchema({
    folderName: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ folderName }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }
    console.log('addOrthogroupTrees', folderName)
    const geneBulkOp = Genes.rawCollection().initializeUnorderedBulkOp();
    const orthoBulkOp = orthogroupCollection.rawCollection().initializeUnorderedBulkOp();
    return globPromise(`${folderName}/*`)
      .then(fileNames => {
        fileNames.forEach(fileName => {
          addOrthogroupTree({ fileName, orthoBulkOp, geneBulkOp })
        })
      })
      .catch(error  => {
        console.log(Object.keys(error))
        if (error.writeErrors){
          error.writeErrors.forEach(err => {
            console.log(err.errmsg)
          })
        }
        throw new Meteor.Error(error)
      })
  }
})