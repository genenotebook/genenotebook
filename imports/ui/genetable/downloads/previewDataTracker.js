import { Meteor } from 'meteor/meteor';

import { Genes } from '/imports/api/genes/gene_collection.js';

export const previewDataTracker = ({ query, ...props }) => {
  const limit = 3;
  const geneSub = Meteor.subscribe('genes', {query, limit});
  const loading = !geneSub.ready();
  const previewGenes = Genes.find(query, {limit: 3}).fetch();
  return {
    loading,
    previewGenes,
    query,
    ...props
  }
};