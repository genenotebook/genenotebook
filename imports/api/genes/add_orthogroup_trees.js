import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';
import glob from 'glob';

import { Orthogroups } from '/imports/api/genes/orthogroup_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { parseNewick } from '/imports/api/util/util.js';
import fs from 'fs';

export const addOrthogroupTrees = new ValidatedMethod({
  name: 'addOrthogroupTrees',
  validate: new SimpleSchema({
    folder: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ folder }){
    console.log('addOrthogroupTrees', folder)
    const geneBulkOp = Genes.rawCollection().initializeUnorderedBulkOp();
    const orthoBulkOp = Orthogroups.rawCollection().initializeUnorderedBulkOp();
    glob(`${folder}/*`, (err, fileNames) => {
      fileNames.forEach(fileName => {
        //console.log(fileName)
        const orthogroupId = fileName.split('/').pop().split('_')[0];
        
        const data = fs.readFileSync(fileName, 'utf8')//, (err, data) => {
          const tree = parseNewick(data);
          orthoBulkOp.insert({
            ID: orthogroupId,
            size: tree.size,
            tree: tree.tree,
            genes: tree.geneIds
          })
          geneBulkOp.find({ID: {$in: tree.geneIds}}).update({$set: {orthogroup: orthogroupId}})
          //console.log(orthogroupId, tree.size, tree.geneIds);
        //});
      })
    console.log('geneBulkOp execute')
    const geneBulkOpResults = geneBulkOp.execute();
    console.log(geneBulkOpResults)
    
    console.log('orthoBulkOp execute')
    const orthoBulkOpResults = orthoBulkOp.execute();
    console.log(orthoBulkOpResults)
    })


  }
})