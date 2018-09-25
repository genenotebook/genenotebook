import React from 'react';

import SampleSelection from './SampleSelection.jsx';
import ExpressionPlot from './ExpressionPlot.jsx';

const GeneExpression = ({ gene, showHeader = false, ...props }) => {
  return <React.Fragment>
    {
      showHeader && <React.Fragment>
        <hr />
        <h3>Gene Expression</h3>
      </React.Fragment>
    }
    <SampleSelection gene={gene} {...props}>
      <ExpressionPlot {...props}/>
    </SampleSelection>
  </React.Fragment>
};

export default GeneExpression;