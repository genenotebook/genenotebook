import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Preview, previewDataTracker } from './Preview.jsx';

const formatAttributes = ({ attributes = {}, ID, parents }) => {
  Object.assign(attributes, { ID, Parent: parents });
  const attributeString = Object.entries(attributes).map((attribute) => {
    const [key, value] = attribute;
    return `${key}=${value}`;
  }).join(';');
  return attributeString;
};

const formatGff3 = (gene) => {
  const gffLines = [`${gene.seqid}\t
    ${gene.source}\t
    ${gene.type}\t
    ${gene.start}\t
    ${gene.end}\t
    ${gene.score}\t
    ${gene.strand}\t
    .\t
    ${formatAttributes(gene)}\n`];
  gene.subfeatures.forEach((subfeature) => {
    gffLines.push(`${gene.seqid}\t
      ${gene.source}\t
      ${subfeature.type}\t
      ${subfeature.start}\t
      ${subfeature.end}\t
      ${subfeature.score}\t
      ${gene.strand}\t
      ${subfeature.phase}\t
      ${formatAttributes(subfeature)}\n`);
  });
  return gffLines;
};

const AnnotationPreview = ({ loading, previewGenes }) => (
  <Preview>
    {loading ? (
      '...loading...'
    ) : (
      previewGenes.map((gene) => formatGff3(gene).map((gffLine) => (
        <span key={gffLine}>
          {gffLine}
          <br />
        </span>
      )))
    )}
  </Preview>
);

export default withTracker(previewDataTracker)(AnnotationPreview);
