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

/**
 * [description]
 * @param  {[type]} date [description]
 * @return {[type]}      [description]
 */
export const formatDate = date => {
  let hours = date.getHours();
  hours = hours < 10 ? `0${hours}` : hours;
  let minutes = date.getMinutes();
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  let day = date.getDate();
  day = day < 10 ? `0${day}` : day;
  const year = date.getFullYear();
  return `${hours}:${minutes} ${month}/${day}/${year}`
}