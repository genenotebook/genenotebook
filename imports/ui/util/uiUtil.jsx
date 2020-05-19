import React from 'react';

export class ErrorBoundary extends React.Component {
  // https://reactjs.org/docs/error-boundaries.html
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

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
 * Inspired by recompose branch, but does not require HOCs
 * Let conditionalRenderingFn decide wether to wrap BranchComponent or Component
 * Used for conditional rendering of composed components
 * @param {Function} conditionalRenderingFn
 * @param {Function} EitherComponent
 * @return {Function}
 */
export const branch = (
  conditionalRenderingFn,
  BranchComponent,
) => (Component) => (props) => (conditionalRenderingFn(props) ? (
  <BranchComponent {...props} />
) : (
  <Component {...props} />
));

/**
 * Inspired by recompose compose
 * @param  {...Function} funcs react components to compose
 * @return {Function} single react component with all HOCs incorporated
 */
export function compose(...funcs) {
  return funcs.reduce((a, b) => function(...args) {
    return a(b(...args));
  }, (arg) => arg); // identity function to initialize reduce
}

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
