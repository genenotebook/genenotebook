/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose, branch, renderComponent } from 'recompose';
import hash from 'object-hash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

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

function AdminGenomes({ genomes }) {
  return (
    <table className="table is-hoverable is-small is-fullwidth">
      <thead>
        <tr>
          {[
            'Reference name',
            'Organism',
            'Description',
            'Public',
            'Permission',
            'Annotation track',
            'Actions',
          ].map((label) => (
            <th key={label} id={label}>
              <button
                type="button"
                className="button is-small is-static is-fullwidth"
              >
                {label}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {genomes.map((genome) => (
          <GenomeInfo key={hash(genome.annotationTrack || {})} {...genome} />
        ))}
      </tbody>
    </table>
  );
}

export default compose(
  withTracker(adminGenomesDataTracker),
  branch(isLoading, renderComponent(Loading)),
)(AdminGenomes);
