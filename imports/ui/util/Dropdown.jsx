import React from 'react';

export class DropdownButton extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const {children, ...props} = this.props;
    return (
      <button type='button' key='dropdownButton' {...props}>
        { children }
      </button>
    )
  }
}

export class DropdownMenu extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const {children, show, ...props} = this.props;
    return (
      <div key='dropdownMenu' className={`dropdown-menu ${show}`} {...props}>
        { children }
      </div>
    )
  }
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
      const onClick = child.type === DropdownButton ? this.open : this.preventClose;
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