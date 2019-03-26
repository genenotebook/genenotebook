import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import { groupBy } from 'lodash';
import Select, { components } from 'react-select';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

function dataTracker(props) {
  const experimentSub = Meteor.subscribe('experimentInfo');
  const loading = !experimentSub.ready();
  const experiments = ExperimentInfo.find({}).fetch();
  const replicaGroups = groupBy(experiments, 'replicaGroup');
  return {
    loading,
    replicaGroups,
    ...props,
  };
}

const customStyles = {
  control: provided => ({
    ...provided,
    minWidth: 100,
    margin: 4,
  }),
  menu: () => ({
    boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.1)',
  }),
};

function DropdownIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <span className="icon-search" />
    </components.DropdownIndicator>
  );
}

function ExpressionDownloadOptions({
  replicaGroups, loading, options, updateOptions
}) {
  const experimentIds = Object.keys(replicaGroups);

  const { selectedSamples = [] } = options;

  const [initialized, setInitialization] = useState(false);
  if (!loading && !initialized) {
    updateOptions({
      selectedSamples: experimentIds.slice(0, 10),
    });
    setInitialization(true);
  }

  function selectSamples(newSelection) {
    updateOptions({
      selectedSamples: newSelection.map(({ label }) => label),
    });
  }

  return (
    <div className="d-flex justify-content-around">
      <Dropdown>
        <DropdownButton className="btn btn-outline-dark dropdown-toggle px-2 py-0 border">
          Select experiments&nbsp;
          <span className="badge badge-dark">
            {loading ? '...' : `${selectedSamples.length} / ${experimentIds.length}`}
          </span>
        </DropdownButton>
        <DropdownMenu className="dropdown-menu-right pt-0">
          <div className="btn-group btn-group-sm mx-1 my-1 d-flex justify-content-end" role="group">
            <button
              className="btn btn-sm btn-outline-dark px-2 py-0 border"
              type="button"
              onClick={() => {
                updateOptions({
                  selectedSamples: experimentIds,
                });
              }}
            >
              Select all
            </button>
            <button
              className="btn btn-sm btn-outline-dark px-2 py-0 border"
              type="button"
              onClick={() => {
                updateOptions({
                  selectedSamples: [],
                });
              }}
            >
              Unselect all
            </button>
          </div>
          <Select
            autoFocus
            backSpaceRemovesValue={false}
            closeMenuOnSelect={false}
            components={{ DropdownIndicator, IndicatorSeparator: null }}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            isClearable={false}
            isMulti
            menuIsOpen
            onChange={(newSelection) => {
              selectSamples(newSelection);
            }}
            options={experimentIds.map(expId => ({
              value: expId,
              label: expId,
            }))}
            placeholder="Search..."
            styles={customStyles}
            tabSelectsValue={false}
            value={selectedSamples.map(expId => ({
              value: expId,
              label: expId,
            }))}
            noOptionsMessage={() => 'No expression data'}
          />
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export default withTracker(dataTracker)(ExpressionDownloadOptions);
