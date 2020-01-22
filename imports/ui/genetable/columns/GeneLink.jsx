import { Meteor } from 'meteor/meteor';

import React from 'react';
import { Link } from 'react-router-dom';

export default function GeneLink({ geneId }) {
  return (
    <Link to={`/gene/${geneId}`} className="genelink" title={geneId}>
      { geneId }
    </Link>
  );
}
