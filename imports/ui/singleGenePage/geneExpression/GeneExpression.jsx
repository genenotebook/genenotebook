/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import SampleSelection from './SampleSelection.jsx';
import ExpressionPlot from './ExpressionPlot.jsx';

function GeneExpression({ gene, showHeader, ...props }) {
  return (
    <React.Fragment>
      {showHeader && (
        <React.Fragment>
          <hr />
          <h3>Gene Expression</h3>
        </React.Fragment>
      )}
      <SampleSelection gene={gene} {...props}>
        <ExpressionPlot {...props} />
      </SampleSelection>
    </React.Fragment>
  );
}

GeneExpression.defaultProps = {
  showHeader: false,
};

GeneExpression.propTypes = {
  gene: PropTypes.object.isRequired,
  showHeader: PropTypes.bool,
};

export default GeneExpression;
