/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

function JobInfo({ job }) {
  const { data } = job;
  const { blastType, input } = data;
  return (
    <fieldset className="border rounded px-3">
      <legend className="w-auto mx-1">Job info</legend>
      <table className="table table-sm table-hover">
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
            <td>Input</td>
            <td>
              <textarea
                className="form-control"
                rows="5"
                value={input}
                style={{ fontFamily: 'monospace' }}
                disabled
              />
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
}

JobInfo.propTypes = {
  job: PropTypes.object.isRequired,
};

function ParameterInfo({ job }) {
  const { data } = job;
  const { blastOptions } = data;
  const { eValue, numAlignments } = blastOptions;
  return (
    <fieldset className="border rounded px-3">
      <legend className="w-auto mx-1">BLAST Parameters</legend>
      <table className="table table-sm table-hover">
        <tbody>
          <tr>
            <td>E-value cutoff</td>
            <td>{eValue}</td>
          </tr>
          <tr>
            <td>Num alignments</td>
            <td>{numAlignments}</td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
}

ParameterInfo.propTypes = {
  job: PropTypes.object.isRequired,
};

function BlastJobInfo({ job }) {
  return (
    <div className="pb-2">
      <JobInfo job={job} />
      <ParameterInfo job={job} />
    </div>
  );
}

BlastJobInfo.propTypes = {
  job: PropTypes.object.isRequired,
};

export default BlastJobInfo;
