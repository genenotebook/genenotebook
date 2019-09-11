/* eslint-disable react/prop-types */
import React from 'react';
import { compose } from 'recompose';

import { removeAnnotationTrack } from '/imports/api/genomes/removeAnnotationTrack.js';
import logger from '/imports/api/util/logger.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import BlastDB from './BlastDB.jsx';

function hasNoAnnotation({ name }) {
  return typeof name === 'undefined';
}

function NoAnnotation() {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm px-2 py-0"
      disabled
    >
      <span className="icon-block" />
      No annotation
    </button>
  );
}

const withConditionalRendering = compose(
  withEither(hasNoAnnotation, NoAnnotation),
);

function AnnotationInfo({
 genomeId, isEditing, name, blastDb 
}) {
  return (
    <table style={{ width: '100%' }}>
      <tbody>
        <tr title={name}>
          <td>{`${name.substring(0, 10)}...`}</td>
        </tr>
        <tr>
          <td>
            <BlastDB
              genomeId={genomeId}
              isEditing={isEditing}
              name={name}
              blastDb={blastDb}
            />
          </td>
        </tr>
        {isEditing && (
          <tr>
            <td>
              <button
                type="button"
                className="btn btn-danger btn-sm px-2 py-0 btn-block"
                onClick={() => {
                  removeAnnotationTrack.call({ genomeId });
                }}
                id={genomeId}
              >
                <span className="icon-exclamation" />
                Delete annotation
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default withConditionalRendering(AnnotationInfo);
