import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';
import fs from 'fs';

import { chunk } from 'lodash';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Interpro } from '/imports/api/genes/interpro_collection.js'; 
import logger from '/imports/api/util/logger.js';

import { parseAttributeString, debugParseAttributeString } from '/imports/api/util/util.js';

const logAttributeError = ({ lineNumber, line, attributeString, error }) => {
  logger.warn(`Error line ${lineNumber}`)
  logger.warn(line.join('\t'))
  logger.warn(attributeString)
  logger.warn(debugParseAttributeString(attributeString))
  throw new Meteor.Error(error)
}

class InterproscanProcessor {
  constructor(){
    this.bulkOp = Genes.rawCollection().initializeUnorderedBulkOp();
    this.lineNumber = 0;
  }

  parse = line => {
    this.lineNumber += 1;
    const [ seqId, source, type, start, end,
      score, strand, phase, attributeString ] = line;

    if (type === 'protein_match'){
      if (typeof attributeString !== 'undefined'){
        let attributes;
        try {
          attributes = parseAttributeString(attributeString);
        } catch (error) {
          logAttributeError({ lineNumber: this.lineNumber, line, 
            attributeString, error });
        }

        const dbUpdate = { $addToSet: {} };

        const { Name, Dbxref = [], Ontology_term = [], 
          signature_desc = [] } = attributes;

        const proteinDomain = { start, end, source, score, name: Name[0] };

        const interproIds = Dbxref.filter(xref => {
          return /InterPro/.test(xref)
        }).map(interproId => {
          const [db, id] = interproId.split(':');
          return id;
        });

        if (interproIds.length) {
          proteinDomain['interproId'] = interproIds[0];
        } else {
          proteinDomain['interproId'] = 'Unintegrated signature';
        }

        if (Dbxref.length) {
          proteinDomain['Dbxref'] = Dbxref;
          dbUpdate['$addToSet']['attributes.Dbxref'] = { $each: Dbxref };
        }

        if (signature_desc.length) {
          proteinDomain['signature_desc'] = signature_desc[0];
        }

        if (Ontology_term.length) {
          proteinDomain['Ontology_term'] = Ontology_term;
          dbUpdate['$addToSet']['attributes.Ontology_term'] = { $each: Ontology_term };
        }

        dbUpdate['$addToSet']['subfeatures.$.protein_domains'] = proteinDomain;

        
        this.bulkOp.find({ 'subfeatures.ID': seqId }).update(dbUpdate);

      } else {
        logger.warn('Undefined attributes:')
        logger.warn(line.join('\t'))
      }
    }
  }

  finalize = () => {
    return this.bulkOp.execute();
  }
}
/*
const scanInterproApi = interproIds => {
  logger.log(interproIds)
  const date = new Date();
  const requests = chunk([...interproIds],10).map(ids => {
    logger.log(ids);
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
    logger.log(error)
    throw new Meteor.Error(error)
  })
}
*/
const parseInterproscanGff = fileName => {
  return new Promise((resolve, reject) => {
    logger.log('addInterproscan', fileName)

    let lineNumber = 0;

    const fileHandle = fs.readFileSync(fileName, { encoding:'binary' });

    const allInterproIds = new Set();

    const lineProcessor = new InterproscanProcessor();

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
          logger.debug(`Processed ${lineNumber} lines`)
        }
        const line = data[0];
        if (line[0][0] === '#'){
          if (/fasta/i.test(line[0])){
            logger.log('Encountered fasta section, stopped parsing')
            parser.abort()
          }
        } else {
          lineProcessor.parse(line);
        }
      },
      complete(results,file) {
        logger.log('Executing bulk operation');
        bukOpResults = lineProcessor.finalize();
        logger.log('Finished');
        resolve(bukOpResults);
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
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }
    return parseInterproscanGff(fileName)
      .catch(error => {
        logger.warn(error)
        throw new Meteor.Error(error)
      })
  }
})
