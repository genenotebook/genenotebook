import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { compose } from 'recompose';
import React, { useState } from 'react';
import { cloneDeep } from 'lodash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
// import logger from '/imports/api/util/logger.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function genomeDataTracker({ ...props }) {
  const genomeSub = Meteor.subscribe('genomes');
  const loading = !genomeSub.ready();
  const genomes = genomeCollection
    .find({
      annotationTrack: { $exists: true },
    })
    .fetch();
  return {
    loading,
    genomes,
    ...props,
  };
}

const withConditionalRendering = compose(
  withTracker(genomeDataTracker),
  withEither(isLoading, Loading),
);

function GenomeSelect({
  genomes, query = {}, updateQuery, ...props
}) {
  const [selectedGenomes, setSelectedGenomes] = useState(
    new Set(genomes.map(genome => genome._id)),
  );

  function toggleGenomeSelect(genomeId) {
    const newSelection = cloneDeep(selectedGenomes);
    const newQuery = cloneDeep(query);

    if (newSelection.has(genomeId)) {
      newSelection.delete(genomeId);
    } else {
      newSelection.add(genomeId);
    }
    setSelectedGenomes(newSelection);

    if (newSelection.size < genomes.length) {
      newQuery.genomeId = { $in: [...newSelection] };
    } else if (hasOwnProperty(query, 'genomeId')) {
      delete newQuery.genomeId;
    }
    updateQuery(newQuery);
  }

  function selectAll() {
    const newSelection = new Set(genomes.map(genome => genome._id));
    setSelectedGenomes(newSelection);

    const newQuery = cloneDeep(query);
    newQuery.genomeId = { $in: [...newSelection] };
    updateQuery(newQuery);
  }

  function unselectAll() {
    const newSelection = new Set();
    setSelectedGenomes(newSelection);

    const newQuery = cloneDeep(query);
    newQuery.genomeId = { $in: [...newSelection] };
    updateQuery(newQuery);
  }

  return (
    <Dropdown>
      <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
        Genomes&nbsp;
        <span className="badge badge-dark">{`${selectedGenomes.size}/${genomes.length}`}</span>
      </DropdownButton>
      <DropdownMenu>
        <h6 className="dropdown-header">Select genomes</h6>
        {genomes.map(({ _id, name }) => {
          const checked = selectedGenomes.has(_id);
          return (
            <div key={`${_id}-${checked}`} className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id={_id}
                checked={checked}
                onChange={() => {
                  toggleGenomeSelect(_id);
                }}
              />
              <label
                className="form-check-label"
                onClick={() => {
                  toggleGenomeSelect(_id);
                }}
              >
                {name}
              </label>
            </div>
          );
        })}
        <div className="dropdown-divider" />
        <div className="btn-group mx-2" role="group">
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={selectAll}>
            Select all
          </button>
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={unselectAll}>
            Unselect all
          </button>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
}

export default withConditionalRendering(GenomeSelect);
