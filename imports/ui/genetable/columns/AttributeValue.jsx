import React from 'react';
import { compose } from 'recompose';
import { withEither } from '/imports/ui/util/uiUtil.jsx';

const isArray = ({ attributeValue }) => {
  return Array.isArray(attributeValue) && attributeValue.length > 1
}

class AttributeValueArray extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showAll: false
    }
  }
  toggleShowAll = event => {
    event.preventDefault();
    this.setState({
      showAll: !this.state.showAll
    });
  }
  render(){
    const maxLength = 2;
    const { showAll } = this.state;
    const { attributeValue } = this.props;
    const values = showAll ? attributeValue : attributeValue.slice(0,maxLength);
    const buttonText = showAll ? 'Show less' : 'Show more ...';
    return <ul className='list-group list-group-flush'>
      {
        values.map(value => {
          return <li key={value} className='list-group-item py-0 px-0'>
            { value }
          </li>
        })
      }
      {
        attributeValue.length > maxLength &&
        <li className='list-group-item py-0 px-0'>
          <a className='px-3' href='#' onClick={this.toggleShowAll}>
            <small>{ buttonText }</small>
          </a>
        </li>
      }
    </ul>
  }
}

const isUndefined = ({ attributeValue }) => {
  return typeof attributeValue === 'undefined';
}

const Undefined = () => {
  return <p className='mb-1' />
}

const withConditionalRendering = compose(
  withEither(isUndefined, Undefined),
  withEither(isArray, AttributeValueArray)
)

class AttributeValue extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showAll: false
    };
  }
  toggleShowAll = event => {
    event.preventDefault();
    this.setState({
      showAll: !this.state.showAll
    })
  }
  render(){
    const maxLength = 100;
    const { showAll } = this.state;
    const attributeValue = String(this.props.attributeValue);

    const value = showAll || attributeValue.length <= maxLength ? attributeValue : 
      `${attributeValue.slice(0, maxLength)}...`;

    const buttonText = showAll ? 'Show less' : 'Show more ...';
    return <React.Fragment>
      <p className='mb-1'>{ value }</p>
      {
        attributeValue.length > maxLength &&
        <a className='px-3 py-0' href='#' onClick={this.toggleShowAll}>
          <small>{ buttonText }</small>
        </a>
      }
    </React.Fragment>
  }
}

export default withConditionalRendering(AttributeValue);