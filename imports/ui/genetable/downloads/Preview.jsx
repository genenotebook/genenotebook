import { Meteor } from 'meteor/meteor';

import { Genes } from '/imports/api/genes/geneCollection.js';

import React from 'react';

function previewDataTracker({ query, ...props }) {
  const limit = 3;
  const geneSub = Meteor.subscribe('genes', { query, limit });
  const loading = !geneSub.ready();
  const previewGenes = Genes.find(query, { limit }).fetch();
  return {
    loading,
    previewGenes,
    query,
    ...props,
  };
}

function Preview({ children }) {
  return (
    <article className="message is-small">
      <div className="message-header">
        <p>Download preview</p>
      </div>
      <div className="message-body download-preview">
        { children }
        ...
      </div>
    </article>
  );
}

export { previewDataTracker, Preview };
