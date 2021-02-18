/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import hash from 'object-hash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

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

function UploadModal() {
  return (
    <div>
      <div className="backdrop" />
      <div className="modal" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              Upload files
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminGenomes({ genomes }) {
  const [showUploadDialog, setUploadDialog] = useState(false);
  function toggleUploadDialog() {
    setUploadDialog(!showUploadDialog);
  }
  const columns = [
    'Reference name',
    'Organism',
    'Description',
    'Public',
    'Permission',
    'Annotation track',
    'Actions',
  ];
  return (
    <>
      <table className="table is-hoverable is-small is-fullwidth">
        <thead>
          <tr>
            <th colSpan={columns.length}>
              <button
                type="button"
                className="button is-info is-light is-small is-fullwidth is-outlined"
                onClick={toggleUploadDialog}
              >
                Upload new genome
              </button>
            </th>
          </tr>
          <tr>
            {columns.map((label) => (
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
      { showUploadDialog && <UploadModal />}
    </>
  );
}

export default compose(
  withTracker(adminGenomesDataTracker),
  branch(isLoading, Loading),
)(AdminGenomes);
