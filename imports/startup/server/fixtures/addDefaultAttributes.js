import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import logger from '/imports/api/util/logger.js';

const PERMANENT_ATTRIBUTES = [
  {
    name: 'Note',
    query: 'attributes.Note',
  },
  {
    name: 'Dbxref',
    query: 'attributes.Dbxref',
  },
  {
    name: 'Ontology Term',
    query: 'attributes.Ontology_term',
  },
  {
    name: 'Orthogroup',
    query: 'orthogroupId',
  },
  {
    name: 'Protein domains',
    query: 'subfeatures.protein_domains',
  },
  {
    name: 'Gene ID',
    query: 'ID',
  },
  {
    name: 'Has changes',
    query: 'changed',
  },
  {
    name: 'Genome',
    query: 'genomeId',
  },
];

export default function addDefaultAttributes() {
  // add some default attributes to filter on
  PERMANENT_ATTRIBUTES.forEach(({ name, query }) => {
    const existingAttribute = attributeCollection.findOne({ name });
    if (typeof existingAttribute === 'undefined') {
      logger.log(`Adding default filter option: ${name}`);
      attributeCollection.update(
        {
          name,
        },
        {
          $setOnInsert: {
            name,
            query,
            defaultShow: false,
            defaultSearch: false,
            allGenomes: true,
          },
        },
        {
          upsert: true,
        },
      ); // end update
    } // end if
  }); // end foreach
}
