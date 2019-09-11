import React from 'react';

/**
 * Round a number to floating point precision [n] (https://stackoverflow.com/a/46854785/6573438)
 * @param  {Number} x Number to be rounded
 * @param  {Number} n Floating point precision
 * @return {Number}   Rounded Number
 */
export function round(x, n) {
  return parseFloat(
    Math.round(x * (10 ** n))
    / (10 ** n),
  ).toFixed(n);
}


/**
 * Let conditionalRenderingFn decide wether to wrap EitherComponent or Component
 * Used for conditional rendering of composed components
 * @param {Function} conditionalRenderingFn
 * @param {Function} EitherComponent
 * @return {Function}
 */
export const withEither = (
  conditionalRenderingFn,
  EitherComponent,
) => Component => props => (conditionalRenderingFn(props) ? (
  <EitherComponent {...props} />
) : (
  <Component {...props} />
));

/**
 * Helper function to see if reactive dataTracker is still loading
 * @param  {Boolean} options.loading
 * @return {Boolean}
 */
export const isLoading = ({ loading }) => loading;

/**
 * Simple React Loading component
 * @return {Function} React Loading component
 */
export function Loading() {
  return <div className="loading">Loading ...</div>;
}

/**
 * [description]
 * @param  {[type]} date [description]
 * @return {[type]}      [description]
 */
export const formatDate = (date) => {
  let hours = date.getHours();
  hours = hours < 10 ? `0${hours}` : hours;
  let minutes = date.getMinutes();
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  let day = date.getDate();
  day = day < 10 ? `0${day}` : day;
  const year = date.getFullYear();
  return `${hours}:${minutes} ${month}/${day}/${year}`;
};
