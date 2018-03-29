import React from 'react';

/**
 * Higher order component for conditional rendering, to be used with compose
 * https://www.robinwieruch.de/gentle-introduction-higher-order-components/
 * @param  {Function}   conditionalRenderingFn Function returning a boolean for condional rendering
 * @param  {Function} EitherComponent       Component to render if conditionalRenderingFn evaluates to true
 * @return {Function}                          
 */
export const withEither = (conditionalRenderingFn, EitherComponent) => (Component) => (props) =>
  conditionalRenderingFn(props)
    ? <EitherComponent { ...props }/>
    : <Component { ...props } />


/**
 * Helper function to see if reactive dataTracker is still loading
 * @param  {Boolean} options.loading 
 * @return {Boolean}                 
 */
export const isLoading = ({ loading }) => {
  return loading
}

/**
 * Simple React Loading component
 * @return {Function} React Loading component
 */
export const Loading = () => {
  return (
    <div>
      Loading ...
    </div>
  )
}
