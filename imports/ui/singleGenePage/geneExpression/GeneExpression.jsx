/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import SampleSelection from './SampleSelection.jsx';
import ExpressionPlot from './ExpressionPlot.jsx';

function GeneExpression({
  gene,
  showHeader = false,
  resizable = false,
}) {
  return (
    <SampleSelection gene={gene} showHeader={showHeader}>
      <ExpressionPlot resizable={resizable} />
    </SampleSelection>
  );
}

GeneExpression.defaultProps = {
  showHeader: false,
  resizable: false,
};

GeneExpression.propTypes = {
  gene: PropTypes.object.isRequired,
  showHeader: PropTypes.bool,
  resizable: PropTypes.bool,
};

export default GeneExpression;
