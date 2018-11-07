import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
//import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './searchBar.scss';

const attributeTracker = ({ highLightSearch, search }) => {
  //FlowRouter.watchPathChange();
  //const { queryParams } = FlowRouter.current();
  const query = new URLSearchParams(search);
  const _attributes = query.get('attributes');
  const searchString = query.get('search');
  //console.log(query.get('attributes'))
  //const queryParams = {};
  //const { attributes: _attributes, search: searchString = '' } = queryParams;
  const selectedAttributes = _attributes ? _attributes.split(',') : [];
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes,
    selectedAttributes,
    searchString,
    highLightSearch
  }
}

const withConditionalRendering = compose(
  withTracker(attributeTracker),
  withEither(isLoading, Loading)
)

class SearchBar extends React.Component {
  constructor(props){
    super(props)
    console.log(props)
    const selectedAttributes = props.selectedAttributes.length ?
      props.selectedAttributes :
      props.attributes
        .filter(attribute => attribute.defaultSearch)
        .map(attribute => attribute.name)
    this.state = {
      selectedAttributes: new Set(selectedAttributes),
      searchString: props.searchString,
      redirectTo: undefined
    }
  }

  componentDidUpdate = () => {
    //console.log('componentDidUpdate', this.props.highLightSearch)
    if (this.props.highLightSearch) {
      this.input.focus();
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
      this.setState({
        redirectTo: `/genes?${queryString}`
      })
      //FlowRouter.go(`/genes?${queryString}`);
    }
  }

  clearSearch = () => {
    this.setState({
      searchString: '',
      redirectTo: '/genes'
    })
    //FlowRouter.go('/genes');
  }

  render(){
    const { attributes } = this.props;
    const { selectedAttributes, searchString, redirectTo } = this.state;

    if ( typeof redirectTo !== 'undefined'){
      return <Redirect to={redirectTo} />
    }

    return <form className="form-inline search mx-auto" role="search" onSubmit={this.search}>
      <div className="input-group input-group-sm">
        <div className="input-group-prepend">
          <Dropdown>
            <DropdownButton className='btn btn-sm btn-outline-dark dropdown-toggle search-dropdown border' />
            <DropdownMenu>
              <h6 className='dropdown-header'>
                Select attributes to search
              </h6>
              {
                attributes.map( ({ name }) => {
                  const checked = selectedAttributes.has(name);
                  return <div key={`${name} ${checked}`} className='form-check px-3 pb-1' 
                    style={{justifyContent: 'flex-start', whiteSpace: 'pre' }}>
                    <input type='checkbox' className='form-check-input' id={name}
                      checked={checked} onChange={this.toggleAttributeSelect} />
                    <label className='form-check-label'>{name}</label>
                  </div>
                })
              }
            </DropdownMenu>
          </Dropdown>
        </div>
        <input 
          type="text" 
          className="form-control border-right-0 border search-bar"
          placeholder="Search genes"
          value={searchString}
          onChange={this.updateSearchString}
          onSubmit={this.search}
          ref={(input) => { this.input = input }} />
        { searchString &&
          <span className='input-group-addon bg-white border-left-0 border pt-1 clear-search'>
            <span className='icon-cancel' onClick={this.clearSearch} />
          </span>
          
        }
        
        <div className="input-group-append btn-group">
          <button type="submit" className="btn btn-sm btn-outline-dark border">
            <span className='icon-search' />
          </button>
        </div>
      </div>
    </form>
  }
}

export default withConditionalRendering(SearchBar);