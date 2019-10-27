import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import logger from '/imports/api/util/logger.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './searchBar.scss';

const attributeTracker = ({ location }) => {
  console.log({ location });
  const {
    search, state: _state = {},
  } = location;
  const state = _state === null ? {} : _state;
  const { highLightSearch = false, redirected = false } = state;

  const query = new URLSearchParams(search);
  const attributeString = query.get('attributes') || '';
  const searchString = query.get('search') || '';

  const selectedAttributes = attributeString.split(',').filter(att => att !== '');
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes,
    selectedAttributes,
    searchString,
    highLightSearch,
  };
};

const withConditionalRendering = compose(
  withRouter,
  withTracker(attributeTracker),
  withEither(isLoading, Loading),
);

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    const selectedAttributes = props.selectedAttributes.length
      ? props.selectedAttributes
      : props.attributes
        .filter(attribute => attribute.defaultSearch)
        .map(attribute => attribute.name);
    this.state = {
      selectedAttributes: new Set(selectedAttributes),
      searchString: props.searchString,
    };
  }

  componentDidUpdate = () => {
    if (this.props.highLightSearch) {
      this.input.focus();
    }
  };

  toggleAttributeSelect = (event) => {
    const attributeName = event.target.id;
    const selectedAttributes = cloneDeep(this.state.selectedAttributes);
    if (selectedAttributes.has(attributeName)) {
      selectedAttributes.delete(attributeName);
    } else {
      selectedAttributes.add(attributeName);
    }
    this.setState({ selectedAttributes });
  };

  updateSearchString = (event) => {
    const searchString = event.target.value;
    this.setState({
      searchString,
    });
  };

  submit = (event) => {
    event.preventDefault();
    const { history } = this.props;
    const { selectedAttributes, searchString } = this.state;
    if (searchString.length && selectedAttributes.size) {
      const query = new URLSearchParams();
      query.set('attributes', [...selectedAttributes]);
      query.set('search', searchString.trim());
      const queryString = query.toString();
      /*
        React Router is supposed to work with the Redirect
        component, but I cannot figure out how to do that so
        I just push to the history instead.
      */
      history.push(`/genes?${queryString}`);
    }
  };

  clearSearch = () => {
    const { history } = this.props;
    this.setState(
      {
        searchString: '',
      },
      (err, res) => {
        if (err) logger.warn(err);
        /*
        React Router is supposed to work with the Redirect
        component, but I cannot figure out how to do that so
        I just push to the history instead.
      */
        history.push('/genes');
      },
    );
  };

  render() {
    const { attributes, currentUrl } = this.props;
    const {
      selectedAttributes, searchString, redirectTo, redirected,
    } = this.state;

    return (
      <form className="form-inline search mx-auto" role="search" onSubmit={this.submit}>
        <div className="input-group input-group-sm">
          <div className="input-group-prepend">
            <Dropdown>
              <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle search-dropdown border" />
              <DropdownMenu>
                <h6 className="dropdown-header">Select attributes to search</h6>
                {attributes.map(({ name }) => {
                  const checked = selectedAttributes.has(name);
                  return (
                    <div
                      key={`${name} ${checked}`}
                      className="form-check px-3 pb-1"
                      style={{ justifyContent: 'flex-start', whiteSpace: 'pre' }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={name}
                        checked={checked}
                        onChange={this.toggleAttributeSelect}
                      />
                      <label className="form-check-label">{name}</label>
                    </div>
                  );
                })}
              </DropdownMenu>
            </Dropdown>
          </div>
          <input
            type="text"
            className="form-control border-right-0 border search-bar"
            placeholder="Search genes"
            value={searchString}
            onChange={this.updateSearchString}
            onSubmit={this.submit}
            ref={(input) => {
              this.input = input;
            }}
          />
          {searchString && (
            <span className="input-group-addon bg-white border-left-0 border pt-1 clear-search">
              <span className="icon-cancel" onClick={this.clearSearch} />
            </span>
          )}

          <div className="input-group-append btn-group">
            <button type="submit" className="btn btn-sm btn-outline-dark border">
              <span className="icon-search" />
            </button>
          </div>
        </div>
      </form>
    );
  }
}

export default withConditionalRendering(SearchBar);
