/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import hash from 'object-hash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GenomeInfo from './GenomeInfo.jsx';

function adminGenomesDataTracker() {
  const subscription = Meteor.subscribe('genomes');
  const loading = !subscription.ready();
  const genomes = genomeCollection.find({}).fetch();
  return {
    genomes,
    loading,
  };
}

const withConditionalRendering = compose(
  withTracker(adminGenomesDataTracker),
  withEither(isLoading, Loading),
);

function AdminGenomes({ genomes }) {
  return (
    <div className="mt-2">
      <table className="table table-hover table-sm">
        <thead>
          <tr>
            {[
              'Reference name',
              'Organism',
              'Description',
              'Public',
              'Permissions',
              'Annotation track',
              'Actions',
            ].map(label => (
              <th key={label} id={label}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark px-2 py-0"
                  disabled
                >
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {genomes.map(genome => (
            <GenomeInfo key={hash(genome.annotationTrack || {})} {...genome} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withConditionalRendering(AdminGenomes);
