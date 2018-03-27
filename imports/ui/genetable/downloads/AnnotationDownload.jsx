import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Genes } from '/imports/api/genes/gene_collection.js';

const formatAttributes = interval => {
  const attributes = interval.attributes;
  attributes.ID = interval.ID;
  const attributeString = Object.entries(attributes).map(attribute => {
    const [key,value] = attribute;
    return `${key}=${value}`
  }).join(';');
  return attributeString
}

const formatGene = gene => {  
  const gffLines = [`${gene.seqid}\t
    ${gene.source}\t
    ${gene.type}\t
    ${gene.start}\t
    ${gene.end}\t
    ${gene.score}\t
    ${gene.strand}\t
    .\t
    ${formatAttributes(gene)}\n`]
  gene.subfeatures.forEach(subfeature => {
    gffLines.push(`${gene.seqid}\t
      ${gene.source}\t
      ${subfeature.type}\t
      ${subfeature.start}\t
      ${subfeature.end}\t
      ${subfeature.score}\t
      ${subfeature.strand}\t
      ${subfeature.phase}\t
      ${formatAttributes(subfeature)}\n`)
  })
  return gffLines
}

class AnnotationDownload extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    console.log(this.props)
    return (
      <div className="card download-preview">
        <div className="card-body">
          <h4 className="card-title">Download preview</h4>
          {
            this.props.previewGenes.map(gene => {
              return formatGene(gene).map(gffLine => {
                return <span key={gffLine}>
                  {gffLine}
                  <br/>
                </span>
              })
            })
          }
        </div>
      </div>
    )
  }
}

export default withTracker(({ geneQuery }) => {
  console.log(geneQuery)
  const geneSub = Meteor.subscribe('genes', 3, false, geneQuery);
  const previewGenes = Genes.find(geneQuery, {limit: 3}).fetch();
  return {
    loading: !geneSub.ready(),
    previewGenes: previewGenes
  }
})(AnnotationDownload);