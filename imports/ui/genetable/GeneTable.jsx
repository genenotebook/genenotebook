import React from 'react';

import GeneTableHeader from './GeneTableHeader.jsx';
import GeneTableBody from './GeneTableBody.jsx';

const GeneTable = props => {
  return (
    <div className="table-responsive">
      <table className="genelist table table-hover table-sm">
        <GeneTableHeader {...props}/>
        <GeneTableBody {...props} />
     </table>
    </div>
  )
}

export default GeneTable