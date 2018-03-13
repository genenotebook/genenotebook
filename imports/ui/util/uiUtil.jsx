import React from 'react';

/**
 * https://www.robinwieruch.de/gentle-introduction-higher-order-components/
 * @param  {[type]}   conditionalRenderingFn [description]
 * @param  {Function} EitherComponent)       [description]
 * @return {[type]}                          [description]
 */
export const withEither = (conditionalRenderingFn, EitherComponent) => (Component) => (props) =>
  conditionalRenderingFn(props)
    ? <EitherComponent />
    : <Component { ...props } />