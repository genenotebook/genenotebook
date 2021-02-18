/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { BlastOptionField } from './SubmitBlast.jsx';

function BlastJobInfo({ job }) {
  const {
    data: {
      blastType,
      input,
      genomeIds,
      blastOptions: { eValue, numAlignments },
    },
  } = job;

  return (
    <fieldset className="box" disabled>
      <legend className="subtitle is-5">Job info</legend>
      <table className="table is-small is-hoverable is-fullwidth">
        <tbody>
          <tr>
            <td>Created</td>
            <td>{job.created.toISOString()}</td>
          </tr>
          <tr>
            <td>BLAST type</td>
            <td>{blastType}</td>
          </tr>
          <tr>
            <td>References</td>
            <td>{genomeIds}</td>
          </tr>
          <tr>
            <td>Input</td>
            <td>
              <textarea
                className="input is-small"
                rows="5"
                value={input}
                style={{ fontFamily: 'monospace' }}
                disabled
              />
            </td>
          </tr>
          <tr>
            <td>BLAST Parameters</td>
            <td>
              <div className="columns">
                <div className="column">
                  <BlastOptionField name="--e-value" value={eValue} disabled />
                </div>
                <div className="column">
                  <BlastOptionField name="--num-alignments" value={numAlignments} disabled />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
}

BlastJobInfo.propTypes = {
  job: PropTypes.object.isRequired,
};

export default BlastJobInfo;
