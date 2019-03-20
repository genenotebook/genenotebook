/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
// import Select from 'react-select';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';

import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from '/imports/ui/util/Dropdown.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import logger from '/imports/api/util/logger.js';

import { submitBlastJob } from '/imports/api/blast/submitblastjob.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import './submitblast.scss';

/**
 * Hard coded map of sequence types to blast database types to select the appropriate blast program
 * @type {Object}
 */
const BLASTTYPES = {
  Nucleotide: {
    Nucleotide: 'blastn',
    Protein: 'blastx',
    'Translated nucleotide': 'tblastx',
  },
  Protein: {
    Protein: 'blastp',
    'Translated nucleotide': 'tblastn',
  },
};

/**
 * Function to determine whether a given sequence string is DNA or protein
 * @param  {String} seq Input sequence, unknown if DNA or protein
 * @return {String}     Either 'Nucleotide' or 'Protein'
 */
function determineSeqType(seq) {
  const dna = 'cgatnCGATN';
  let fractionDna = 0;

  for (let i = dna.length; i >= 0; i -= 1) {
    const nuc = dna[i];
    fractionDna += (seq.split(nuc).length - 1) / seq.length;
  }

  const seqType = fractionDna >= 0.9 ? 'Nucleotide' : 'Protein';
  return seqType;
}

/**
 * Textarea input field to input sequences for blasting
 * @param  {Object} props [description]
 * @return {SequenceInput}       [description]
 */
function SequenceInput({
 value, enterSequence, seqType, selectSeqType 
}) {
  return (
    <div>
      <textarea
        className="form-control"
        rows="10"
        id="blast_seq"
        type="text"
        placeholder="Enter sequence"
        value={value}
        onChange={enterSequence}
      />
      {value && (
        <div className="btn-group pull-right">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm disabled"
          >
            This is a
          </button>
          <Dropdown>
            <DropdownButton className="btn btn-secondary btn-sm dropdown-toggle">
              <strong>{seqType}</strong>
              &nbsp;sequence
            </DropdownButton>
            <DropdownMenu>
              <button
                type="button"
                className="dropdown-item"
                id="Protein"
                onClick={selectSeqType}
              >
                Protein sequence
              </button>
              <button
                type="button"
                className="dropdown-item"
                id="Nucleotide"
                onClick={selectSeqType}
              >
                Nucleotide sequence
              </button>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}
    </div>
  );
}

function GenomeSelect({ genomes, selectedGenomes, toggleGenomeSelect }) {
  return (
    <div>
      <label> Select genomes </label>
      {genomes.map((genome) => {
        const { _id: genomeId, name } = genome;
        return (
          <div className="form-check" key={genomeId}>
            <input
              type="checkbox"
              className="form-check-input"
              id={genomeId}
              checked={selectedGenomes.has(genomeId)}
              onChange={toggleGenomeSelect}
            />
            <label className="form-check-label" htmlFor={name}>
              {name}
            </label>
          </div>
        );
      })}
      {genomes.length === 0 && (
        <div className="alert alert-danger" role="alert">
          No BLAST databases found!
        </div>
      )}
    </div>
  );
}

function SubmitButtons({
  selectDbType,
  selectedDbType,
  dbTypes,
  submit,
  blastType,
}) {
  return (
    <div className="btn-group">
      <div className="btn-group">
        <Dropdown>
          <DropdownButton className="btn btn-outline-primary dropdown-toggle">
            <strong>{selectedDbType}</strong>
            database
          </DropdownButton>
          <DropdownMenu>
            {dbTypes.map(dbType => (
              <button
                type="button"
                key={dbType}
                className="dropdown-item db-select"
                id={dbType}
                onClick={selectDbType}
              >
                {dbType}
                database
              </button>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-primary"
          id="submit-blast"
          onClick={submit}
        >
          <span className="glyphicon glyphicon-search" />
          {blastType.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function dataTracker() {
  const subscription = Meteor.subscribe('genomes');
  const loading = !subscription.ready();
  const genomes = genomeCollection
    .find({
      'annotationTrack.blastDb': {
        $exists: 1,
      },
    })
    .fetch();
  return {
    loading,
    genomes,
  };
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
);

function SubmitBlast({ genomes }) {
  const [redirect, setRedirect] = useState(
    Meteor.userId() ? undefined : 'login',
  );

  const [selectedGenomes, setSelectedGenomes] = useState(new Set());
  function toggleGenomeSelect(event) {
    const genomeId = event.target.id;
    const newSelectedGenomes = new Set([...selectedGenomes]);
    if (newSelectedGenomes.has(genomeId)) {
      newSelectedGenomes.delete(genomeId);
    } else {
      newSelectedGenomes.add(genomeId);
    }
    setSelectedGenomes(newSelectedGenomes);
  }

  const [dbType, setDbType] = useState('Protein');
  function selectDbType(event) {
    event.preventDefault();
    const newDbType = event.target.id;
    setDbType(newDbType);
  }

  const [seqType, setSeqType] = useState('Nucleotide');
  function selectSeqType(event) {
    event.preventDefault();
    const newSeqType = event.target.id;
    const newDbType = Object.keys(BLASTTYPES[newSeqType])[0];
    setSeqType(newSeqType);
    setDbType(newDbType);
  }

  const [input, setInput] = useState('');
  function enterSequence(event) {
    event.preventDefault();
    const newInput = event.target.value || '';
    if (newInput.length > 0) {
      setSeqType(determineSeqType(newInput));
    }
    setInput(newInput);
  }

  function submit(event) {
    event.preventDefault();
    const blastType = BLASTTYPES[seqType][dbType];
    submitBlastJob.call(
      {
        blastType,
        input,
        genomeIds: [...selectedGenomes],
      },
      (err, res) => {
        if (err) logger.warn(err);
        setRedirect(`blast/${res}`);
      },
    );
  }

  if (typeof redirect !== 'undefined') {
    return <Redirect to={{ pathname: redirect, from: 'blast' }} />;
  }

  return (
    <form className="container form-group py-2" id="blast">
      <div className="card">
        <div className="card-header">Blast search</div>
        <div className="card-body">
          <SequenceInput
            value={input}
            seqType={seqType}
            enterSequence={enterSequence}
            selectSeqType={selectSeqType}
          />
        </div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <GenomeSelect
              genomes={genomes}
              selectedGenomes={selectedGenomes}
              toggleGenomeSelect={toggleGenomeSelect}
            />
          </li>
          <li className="list-group-item">Advanced options ...</li>
        </ul>
        <div className="card-footer">
          <div className="row">
            <p className="col-md-4">Search a ...</p>
            <div className="col-md-6">
              {!input && (
                <button
                  type="button"
                  className="btn btn-outline-secondary disabled"
                >
                  <span className="icon-questionmark" />
                  Enter sequence
                </button>
              )}
              {input && selectedGenomes.size === 0 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary disabled"
                >
                  <span className="icon-questionmark" />
                  Select genome annotation
                </button>
              )}
              {input && selectedGenomes.size > 0 && (
                <SubmitButtons
                  selectedDbType={dbType}
                  dbTypes={Object.keys(BLASTTYPES[seqType])}
                  selectDbType={selectDbType}
                  blastType={BLASTTYPES[seqType][dbType]}
                  submit={submit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default withConditionalRendering(SubmitBlast);
