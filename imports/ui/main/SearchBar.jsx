import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

const attributeTracker = () => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading,
    attributes
  }
}

const SearchBar = () => {
  return <form className="form-inline search mx-auto" role="search">
    <div className="input-group input-group-sm mb-0">
      <input type="text" className="form-control" />
      <div className="input-group-append btn-group">
        <button type="button" className="btn btn-sm btn-outline-secondary">Search</button>
        <Dropdown>
          <DropdownButton className='btn btn-sm btn-outline-secondary dropdown-toggle dropdown-toggle-split' />
          <DropdownMenu className='dropdown-menu dropdown-menu-left'>
            <a className="dropdown-item disabled" disabled>Genes</a>
            <a className="dropdown-item disabled" disabled>Genomes</a>
            <a className="dropdown-item disabled" disabled>Transcriptomes</a>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  </form>
}

export default withTracker(attributeTracker)(SearchBar);