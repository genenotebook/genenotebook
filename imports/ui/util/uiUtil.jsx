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
    ? <EitherComponent />
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

export const DropdownButton = ({children, ...props}) => {
  return (
    <button key='dropdownButton' {...props}>
      { children }
    </button>
  )
}

export const DropdownMenu = ({children, show, ...props}) => {
  return (
    <div key='dropdownMenu' className={`dropdown-menu ${show}`} {...props}>
      { children }
    </div>
  )
}

export class Dropdown extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      show: ''
    }
  }

  open = () => {
    this.setState({
      show: 'show'
    })
    document.addEventListener('click', this.close);
  }

  close = () => {
    this.setState({
      show: ''
    })
    document.removeEventListener('click', this.close);
  }

  preventClose = event => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  renderChildren = () => {
    return React.Children.map(this.props.children, child => {
      const onClick = child.props.type === 'button' ? this.open : this.preventClose;
      return React.cloneElement(child, {
        onClick: onClick,
        show: this.state.show
      })
    })
  }

  render(){
    return (
      <div className='dropdown btn-group'>
        {
          this.renderChildren()
        }
      </div>
    )
  }
}