import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './searchBar.scss';

const attributeTracker = () => {
  FlowRouter.watchPathChange();
  const { queryParams } = FlowRouter.current();
  const { attributes: _attributes, search: searchString = '' } = queryParams;
  const selectedAttributes = _attributes ? _attributes.split(',') : [];
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes,
    selectedAttributes,
    searchString
  }
}

const withConditionalRendering = compose(
  withTracker(attributeTracker),
  withEither(isLoading, Loading)
)

class SearchBar extends React.PureComponent {
  constructor(props){
    super(props)
    const selectedAttributes = props.selectedAttributes.length ?
      props.selectedAttributes :
      props.attributes
        .filter(attribute => attribute.defaultSearch)
        .map(attribute => attribute.name)
    this.state = {
      selectedAttributes: new Set(selectedAttributes),
      searchString: props.searchString
    }
  }

  toggleAttributeSelect = event => {
    const attributeName = event.target.id;
    const selectedAttributes = cloneDeep(this.state.selectedAttributes);
    if (selectedAttributes.has(attributeName)){
      selectedAttributes.delete(attributeName)
    } else {
      selectedAttributes.add(attributeName)
    }
    this.setState({ selectedAttributes });
  }

  updateSearchString = event => {
    const searchString = event.target.value;
    this.setState({
      searchString
    })
  }

  search = event => {
    event.preventDefault();
    const { selectedAttributes, searchString } = this.state;
    console.log(selectedAttributes, searchString)
    if (searchString.length && selectedAttributes.size){
      const attributeString = [...selectedAttributes].join(',');
      const queryString = `attributes=${attributeString}&search=${searchString}`;
      console.log(queryString)
      FlowRouter.go(`/genes?${queryString}`);
    }
  }

  clearSearch = () => {
    this.setState({
      searchString: ''
    })
    FlowRouter.go('/genes');
  }

  render(){
    const { attributes } = this.props;
    const { selectedAttributes, searchString } = this.state;
    return <form className="form-inline search mx-auto" role="search" onSubmit={this.search}>
      <div className="input-group input-group-sm">
        {
          searchString && 
          <div className='input-group-prepend'>
            <button type="button" className="btn btn-sm btn-danger" onClick={this.clearSearch}>
              <span className='icon-cancel' />
            </button>
          </div>
        }
        <input 
          type="text" 
          className="form-control"
          placeholder="Search genes"
          value={searchString}
          onChange={this.updateSearchString}
          onSubmit={this.search} />
        <div className="input-group-append btn-group">
          <button type="submit" className="btn btn-sm btn-outline-secondary">
            <span className='icon-search' />
          </button>
          <Dropdown>
            <DropdownButton className='btn btn-sm btn-outline-secondary dropdown-toggle dropdown-toggle-split' />
            <DropdownMenu>
              {
                attributes.map( ({ name }) => {
                  const checked = selectedAttributes.has(name);
                  return <div key={`${name} ${checked}`} className='form-check px-2' style={{justifyContent: 'flex-start'}}>
                    <input type='checkbox' className='form-check-input' id={name}
                      checked={checked} onChange={this.toggleAttributeSelect} />
                    <label className='form-check-label'>{name}</label>
                  </div>
                })
              }
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </form>
  }
}

export default withConditionalRendering(SearchBar);