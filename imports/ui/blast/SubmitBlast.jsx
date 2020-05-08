/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';
import logger from '/imports/api/util/logger.js';

import submitBlastJob from '/imports/api/blast/submitblastjob.js';
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
  value, enterSequence, seqType: selectedSeqType, selectSeqType,
}) {
  return (
    <div className="sequence-input">
      <textarea
        className="textarea is-small"
        rows="7"
        id="blast_seq"
        type="text"
        placeholder="Enter sequence"
        value={value}
        onChange={enterSequence}
      />
      <div className="field has-addons seqtype-menu" role="group">
        <div className="control">
          <button
            className="button is-small is-fullwidth genetable-dropdown is-static"
            type="button"
          >
            This is a
          </button>
        </div>
        <div className="control">
          <div className={`dropdown is-right ${value ? 'is-hoverable' : ''}`}>
            <div className="dropdown-trigger">
              <button
                type="button"
                className={`button is-small ${value ? '' : 'is-static'}`}
              >
                <strong>{ value ? selectedSeqType : 'empty' }</strong>
                  &nbsp;sequence
              </button>
            </div>
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-content">
                {['Protein', 'Nucleotide'].map((seqType) => (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a
                    href="#"
                    className={`dropdown-item ${seqType === selectedSeqType ? 'is-active' : ''}`}
                    id={seqType}
                    onClick={selectSeqType}
                  >
                    {`${seqType} sequence`}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenomeSelect({ genomes, selectedGenomes, toggleGenomeSelect }) {
  return (
    <fieldset className="box">
      <legend className="subtitle is-5">
        Select genomes
      </legend>
      {genomes.map((genome) => {
        const { _id: genomeId, name } = genome;
        return (
          <div className="form-check mb-1" key={genomeId}>
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
    </fieldset>
  );
}

export function BlastOptionField({
  name, value, setValue, disabled = false,
}) {
  return (
    <div className="field has-addons blast-option-field">
      <p className="control">
        <button type="button" className="button is-static is-small">
          { name }
        </button>
      </p>
      <p className="control">
        <input
          type="text"
          className="input is-small"
          disabled={disabled}
          value={value}
          onChange={({ target }) => {
            setValue(target.value);
          }}
          style={{ maxWidth: '4em' }}
        />
      </p>
    </div>
  );
}

function AdvancedOptions({
  eValue, setEValue, numAlignments, setNumAlignments,
}) {
  return (
    <fieldset className="box">
      <legend className="subtitle is-5">
        BLAST options
      </legend>
      <div className="columns">
        <div className="column">
          <BlastOptionField name="--e-value" value={eValue} setValue={setEValue} />
        </div>
        <div className="column">
          <BlastOptionField
            name="--num-alignments"
            value={numAlignments}
            setValue={setNumAlignments}
          />
        </div>
      </div>
    </fieldset>
  );
}

function SubmitButtons({
  input,
  selectedGenomes,
  selectDbType,
  selectedDbType,
  dbTypes,
  submit,
  blastType,
}) {
  if (!input) {
    return (
      <button
        type="button"
        className="button is-small is-static"
      >
        <span className="icon-questionmark" />
        Enter sequence
      </button>
    );
  }
  if (input && selectedGenomes.size === 0) {
    return (
      <button
        type="button"
        className="button is-small is-static"
      >
        <span className="icon-questionmark" />
        Select genome annotation
      </button>
    );
  }

  return (
    <div className="field is-grouped submit-buttons">
      <p className="control">
        <div className="field has-addons">
          <p className="control">
            <button
              type="button"
              className="button is-small is-static"
            >
              Search a
            </button>
          </p>
          <p className="control dropdown is-hoverable is-right">
            <div className="dropdown-trigger">
              <button type="button" className="button is-small">
                <strong>{selectedDbType}</strong>
                &nbsp;database
              </button>
            </div>
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-content">
                {dbTypes.map((dbType) => (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a
                    href="#"
                    key={dbType}
                    className="dropdown-item"
                    id={dbType}
                    onClick={selectDbType}
                  >
                    {`${dbType} database`}
                  </a>
                ))}
              </div>
            </div>
          </p>
        </div>
      </p>
      <p className="control">
        <button
          className="button is-primary is-small"
          type="button"
          onClick={submit}
        >
          <span className="icon-database" />
          {blastType.toUpperCase()}
        </button>
      </p>
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

function SubmitBlast({ genomes }) {
  const [redirect, setRedirect] = useState(
    Meteor.userId() ? undefined : 'login',
  );

  const [eValue, setEValue] = useState('10');
  const [numAlignments, setNumAlignments] = useState('50');

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
        blastOptions: {
          eValue,
          numAlignments,
        },
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
    <form className="container" id="blast">
      <div className="card">
        <header className="has-background-light">
          <h4 className="title is-size-4 has-text-weight-light">
            BLAST search
          </h4>
        </header>
        <div className="card-content">
          <SequenceInput
            value={input}
            seqType={seqType}
            enterSequence={enterSequence}
            selectSeqType={selectSeqType}
          />
          <GenomeSelect
            genomes={genomes}
            selectedGenomes={selectedGenomes}
            toggleGenomeSelect={toggleGenomeSelect}
          />
          <AdvancedOptions
            eValue={eValue}
            setEValue={setEValue}
            numAlignments={numAlignments}
            setNumAlignments={setNumAlignments}
          />
        </div>
        <div className="card-footer has-background-light level">
          <div className="level-item">
            <SubmitButtons
              input={input}
              selectedGenomes={selectedGenomes}
              selectedDbType={dbType}
              dbTypes={Object.keys(BLASTTYPES[seqType])}
              selectDbType={selectDbType}
              blastType={BLASTTYPES[seqType][dbType]}
              submit={submit}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default compose(
  withTracker(dataTracker),
  branch(isLoading, Loading),
)(SubmitBlast);
