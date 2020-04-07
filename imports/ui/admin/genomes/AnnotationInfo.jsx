/* eslint-disable react/prop-types */
import React from 'react';
import { compose, branch, renderComponent } from 'recompose';

import { removeAnnotationTrack }
  from '/imports/api/genomes/removeAnnotationTrack.js';

import BlastDB from './BlastDB.jsx';

function hasNoAnnotation({ name }) {
  return typeof name === 'undefined';
}

function NoAnnotation() {
  return (
    <button
      type="button"
      className="button is-small is-inactive"
    >
      <span className="icon-block" />
      No annotation
    </button>
  );
}

function AnnotationInfo({
  genomeId, isEditing, name, blastDb,
}) {
  return (
    <ul>
      <li title={name}>
        {`${name.substring(0, 15)}...`}
      </li>
      <li>
        <BlastDB
          genomeId={genomeId}
          isEditing={isEditing}
          name={name}
          blastDb={blastDb}
        />
      </li>
      {isEditing && (
        <li>
          <button
            type="button"
            className="button is-fullwidth is-danger is-outlined is-light is-fullwidth is-small"
            onClick={() => {
              removeAnnotationTrack.call({ genomeId });
            }}
            id={genomeId}
          >
            <span className="icon-exclamation" />
            Delete annotation
            <span className="icon-exclamation" />
          </button>
        </li>
      )}
    </ul>
  );
}
export default compose(
  branch(hasNoAnnotation, renderComponent(NoAnnotation)),
)(AnnotationInfo);
