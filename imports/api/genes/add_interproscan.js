import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';

import { Genes } from '/imports/api/genes/gene_collection.js';
import fs from 'fs';

/**
 * [description]
 * @param  {[type]} attributeString [description]
 * @return {[type]}                 [description]
 */
const formatAttributes = attributeString => {
  return attributeString.split(';').reduce((attributes, stringPart) => {
    const [key, value] = stringPart.split('=')
    attributes[key] = value.split('"').join('').split(',').map(decodeURIComponent)
    return attributes;
  }, {})
}

export const addInterproscan = new ValidatedMethod({
  name: 'addInterproscan',
  validate: new SimpleSchema({
    fileName: { type: String },
    trackName: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ fileName, trackName }){
    console.log('addInterproscan', trackName, fileName)

    const fileHandle = fs.readFileSync(fileName, { encoding:'binary' });

    const interproIds = new Set();

    Papa.parse(fileHandle, {
      delimiter: '\t',
      dynamicTyping: true,
      skipEmptyLines: true,
      //comments: '#',
      error(error,file) {
        console.log(error)
      },
      step(line, parser){
        const data = line.data[0];
        if (data[0][0] === '#'){
          if (/fasta/i.test(data[0])){
            console.log('Encountered fasta section, stopped parsing')
            parser.abort()
          }
        } else {
          console.log(data)
          const [
            seqId,
            source,
            type,
            start,
            end,
            score,
            strand,
            phase,
            attributeString
          ] = data;

          if (type === 'protein_match'){
            const attributes = formatAttributes(attributeString);
            const name = attributes['Name'][0];
            const proteinDomain = {
              start,
              end,
              source,
              score,
              name
            }
            const dbxref = attributes['Dbxref'];
            if (typeof dbxref !== 'undefined'){
              proteinDomain['dbxref'] = dbxref;
              let hasInterpro = false;
              dbxref.forEach(crossref => {
                const [db, id] = crossref.split(':')
                if (/InterPro/.test(db)){
                  hasInterpro = true
                  proteinDomain['interpro'] = id;
                  interproIds.add(id)
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

            Genes.update({
              'subfeatures.ID': seqId
            },{ 
              $addToSet: { 
                'subfeatures.$.protein_domains': proteinDomain
              }
            })
          }
        }

      },
      complete(results,file) {
        console.log(interproIds)
      }
    })
  }
})