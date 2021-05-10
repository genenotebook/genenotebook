/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useEffect, useState } from 'react';
import hash from 'object-hash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import addGenome from '/imports/api/genomes/addGenome.js';
import { fileCollection } from '/imports/api/files/fileCollection.js';
import jobQueue from '/imports/api/jobqueue/jobqueue.js';

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

function uploadDataTracker() {
  const genomeFileSub = Meteor.subscribe('genomeFiles');
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !genomeFileSub.ready() || !jobQueueSub.ready();
  return { loading };
}

function insertFile({ file, meta, setUploadProgress }) {
  return new Promise((resolve, reject) => {
    fileCollection.insert({
      file,
      meta,
      chunkSize: 'dynamic',
      onStart(err) {
        if (err) reject(err);
        setUploadProgress(0);
      },
      onProgress(progress) {
        setUploadProgress(progress);
      },
      onUploaded(err, fileRef) {
        if (err) reject(err);
        resolve(fileRef);
      },
      onError(err) {
        reject(err);
      },
    });
  });
}

// eslint-disable-next-line no-underscore-dangle
function _UploadModal({ closeModal }) {
  const [selectedFile, setSelectedFile] = useState(undefined);
  function fileSelectHandler({ target: { files } }) {
    setSelectedFile(files[0]);
  }
  const [genomeName, setGenomeName] = useState(undefined);
  const [uploadProgress, setUploadProgress] = useState(undefined);
  const [addGenomeJob, setAddGenomeJob] = useState(undefined);
  function startUpload() {
    console.log('startUpload');
    if (selectedFile) {
      console.log({ selectedFile });
      insertFile({
        file: selectedFile,
        meta: {
          userId: Meteor.userId(),
          genomeName,
        },
        setUploadProgress,
      }).then((uploadedFile) =>
        // console.log({ uploadedFile });
        addGenome.call({
          fileName: uploadedFile.path,
          genomeName,
        })).then((jobId) => {
        const job = jobQueue.getJob(jobId);
        setAddGenomeJob(job);
      });
    }
  }

  useEffect(() => {
    if (addGenomeJob && addGenomeJob.status === 'ready') {
      alert('Upload completed');
    }
  }, [addGenomeJob]);

  return (
    <div className="modal upload-dialog">
      <div className="modal-background" />
      <div className="modal-card">
        <form>
          <header className="modal-card-head">
            <p className="modal-card-title">
              Upload genome file
            </p>
            <button
              type="button"
              className="delete is-pulled-right"
              aria-label="close"
              onClick={closeModal}
            />
          </header>
          <section className="modal-card-body">
            <div className="file is-boxed is-centered has-name is-small">
              <label className="file-label">
                <input
                  className="file-input"
                  type="file"
                  onChange={fileSelectHandler}
                  name="resume"
                />
                <span className="file-cta">
                  <span className="file-icon">
                    <span className="icon-file" />
                  </span>
                  <span className="file-label">
                    Select genome file
                  </span>
                </span>
                <span className="file-name">
                  {selectedFile
                    ? selectedFile.name
                    : 'No file selected'}
                </span>
              </label>
            </div>
            {uploadProgress
            && (
            <progress
              className="progress is-small"
              value={uploadProgress}
              max="100"
            >
              {uploadProgress}
            </progress>
            )}
            <div className="field">
              <input
                type="text"
                className="input is-small"
                id="name"
                aria-describedby="referenceName"
                value={genomeName}
                onChange={(event) => {
                  setGenomeName(event.target.value);
                }}
              />
              <small id="referenceNameHelp" className="help">
                Genome names must be unique
              </small>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button
              type="button"
              className="button is-success is-small is-light is-outlined"
              disabled={!selectedFile /* validInput */}
              onClick={startUpload}
            >
              Upload
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

const UploadModal = compose(
  withTracker(uploadDataTracker),
  branch(isLoading, Loading),
)(_UploadModal);

function AdminGenomes({ genomes }) {
  const [showUploadDialog, setUploadDialog] = useState(false);
  function toggleUploadDialog() {
    setUploadDialog(!showUploadDialog);
  }
  function closeUploadDialog() {
    setUploadDialog(false);
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
      { showUploadDialog && <UploadModal closeModal={closeUploadDialog} />}
    </>
  );
}

export default compose(
  withTracker(adminGenomesDataTracker),
  branch(isLoading, Loading),
)(AdminGenomes);
