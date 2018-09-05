import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';
import fs from 'fs';
import * as _request from 'request-promise-native';
const request = _request.default;

import { chunk } from 'lodash';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Interpro } from '/imports/api/genes/interpro_collection.js'; 

import { formatAttributes, debugFormatAttributes } from '/imports/api/util/util.js';

const processInterproscanGffLine = ({ line, bulkOp }) => {
  const [ seqId, source, type, start, end,
      score, strand, phase, attributeString ] = line;
  const interproIds = new Set();

  if (type === 'protein_match'){
    if (typeof attributeString !== 'undefined'){
      let attributes;
      try {
        attributes = formatAttributes(attributeString);
      } catch (error) {
        console.log(`Error line ${lineNumber}`)
        console.log(line.join('\t'))
        console.log(attributeString)
        console.log(debugFormatAttributes(attributeString))
        throw new Meteor.Error(error)
      }

      const name = attributes['Name'][0];
      const proteinDomain = { start, end, source, score, name };
      const dbxref = attributes['Dbxref'];
      
      if (typeof dbxref !== 'undefined'){
        proteinDomain['dbxref'] = dbxref;
        let hasInterpro = false;
        dbxref.forEach(crossref => {
          const [db, id] = crossref.split(':')
          if (/InterPro/.test(db)){
            hasInterpro = true
            proteinDomain['interpro'] = id;
            interproIds.add(id);
          }
        })
        if (!hasInterpro) {
          proteinDomain['interpro'] = 'Unintegrated signature';
        }
      } else {
        proteinDomain['interpro'] = 'Unintegrated signature';
      }

      if (typeof attributes['signature_desc'] !== 'undefined'){
        proteinDomain['signature_desc'] = attributes['signature_desc'][0];
      }

      bulkOp.find({
        'subfeatures.ID': seqId
      }).updateOne({
        $addToSet: { 
          'subfeatures.$.protein_domains': proteinDomain,
          'attributes.interproIds': [...interproIds]
        }
      })
      /*
      Genes.update({
        'subfeatures.ID': seqId
      },{ 
        $addToSet: { 
          'subfeatures.$.protein_domains': proteinDomain,
          'attributes.interproIds': [...interproIds]
        }
      })
      */
    } else {
      console.log('Undefined attributes:')
      console.log(line.join('\t'))
    }
  }
  return interproIds;
}

const scanInterproApi = interproIds => {
  console.log(interproIds)
  const date = new Date();
  const requests = chunk([...interproIds],10).map(ids => {
    console.log(ids);
    return request(`http://www.ebi.ac.uk/Tools/dbfetch/dbfetch/interpro/${ids.join(',')}/tab`)
  })
  Promise.all(requests).then(results => {
    results.forEach(result => {
      const lines = result.split('\n');
      const dbVersion = lines[0].split()[1];
      lines.forEach((line, lineIndex) => {
        if ( line[0] !== '#' ) {
          const [interproId, interproType, shortName, name] = line.split('\t');
          Interpro.update({
            interproId
          },{
            $set: {
              interproId, interproType, shortName, name, dbVersion, date
            }
          },
          {
            upsert: true
          })
        }
      })
    })
  }).catch(error => {
    console.log(error)
    throw new Meteor.Error(error)
  })
}

const parseInterproscanGff = fileName => {
  return new Promise((resolve, reject) => {
    console.log('addInterproscan', fileName)

    let lineNumber = 0;

    const fileHandle = fs.readFileSync(fileName, { encoding:'binary' });

    const allInterproIds = new Set();
    const bulkOp = Genes.initializeUnorderedBulkOp();

    Papa.parse(fileHandle, {
      delimiter: '\t',
      dynamicTyping: true,
      skipEmptyLines: true,
      error(error,file) {
        reject(error)
      },
      step({ data }, parser){
        lineNumber += 1;
        if (lineNumber % 100 === 0){
          console.log(`Processed ${lineNumber} lines`)
        }
        const line = data[0];
        if (line[0][0] === '#'){
          if (/fasta/i.test(line[0])){
            console.log('Encountered fasta section, stopped parsing')
            parser.abort()
          }
        } else {
          const interproIds = processInterproscanGffLine({ line, bulkOp });
          for (let interproId of interproIds){
            allInterproIds.add(interproId)
          }
        }

      },
      complete(results,file) {
        console.log('Finished')
        resolve(allInterproIds)
      }
    })
  })
}

export const addInterproscan = new ValidatedMethod({
  name: 'addInterproscan',
  validate: new SimpleSchema({
    fileName: { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ fileName }){
    return parseInterproscanGff(fileName)
      .catch(error => {
        console.log(error)
        throw new Meteor.Error(error)
      })
  }
})