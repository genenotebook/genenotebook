import { Meteor } from 'meteor/meteor';

import React from 'react';

const GeneLink = ({ geneId }) => {
  return <a className='genelink' title={geneId} 
    href={`${Meteor.absoluteUrl()}gene/${geneId}`}>
    { geneId }
  </a>
}

export default GeneLink;