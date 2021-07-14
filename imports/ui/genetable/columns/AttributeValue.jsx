import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';

import { dbxrefCollection } from '/imports/api/genes/dbxrefCollection.js';
import { DBXREF_REGEX } from '/imports/api/util/util.js';

import { compose, branch } from '/imports/ui/util/uiUtil.jsx';

function isArray(x) {
  return Array.isArray(x) && x.length > 1;
}

function notDbxref({ value }) {
  return !(
    DBXREF_REGEX.go.test(value)
    || DBXREF_REGEX.interpro.test(value)
  );
}

function SimpleAttribute({ value }) {
  return value;
}

function dbxrefTracker({ value: dbxrefId }) {
  const sub = Meteor.subscribe('dbxref', { dbxrefId });
  const loading = !sub.ready();
  const dbxref = dbxrefCollection.findOne({ dbxrefId });
  return {
    dbxrefId,
    dbxref,
    loading,
  };
}

function DbxrefAttribute({ loading, dbxrefId, dbxref = {} }) {
  const { url = '#', description = '' } = dbxref;
  return (
    url === '#'
      ? <SimpleAttribute value={dbxrefId} />
      : (
        <>
          <a href={url}>{dbxrefId}</a>
          {' '}
          { description }
        </>
      )
  );
}

const DetailedSingleAttribute = compose(
  branch(notDbxref, SimpleAttribute),
  withTracker(dbxrefTracker),
)(DbxrefAttribute);
/*
function DetailedSingleAttribute({ value: valueStr }) {
  const [description, setDescription] = useState('');

  let url;

  if (/^(GO:[0-9]{7})$/.test(valueStr)) {
    url = `http://amigo.geneontology.org/amigo/term/${valueStr}`;
    fetch(`http://api.geneontology.org/api/bioentity/${valueStr}`)
      .then((res) => res.json())
      .then((data) => {
        setDescription(data.label);
      })
      .catch(console.log);
  } else if (/^(InterPro:IPR[0-9]{6})$/.test(valueStr)) {
    url = `https://www.ebi.ac.uk/interpro/entry/${valueStr.replace('InterPro:', '')}`;
    fetch(`https://www.ebi.ac.uk/interpro/api/entry/interpro/${valueStr.replace('InterPro:', '')}`)
      .then((res) => res.json())
      .then((data) => {
        setDescription(data.metadata.name.name);
      })
      .catch(console.log);
  }

  const value = url !== 'undefined'
    ? <a href={url}>{valueStr}</a>
    : valueStr;

  return (
    <>
      { value}
      {' '}
      {description}
    </>
  );
}
*/

function AttributeValueArray({
  attrArray, showAll, toggleShowAll, maxLength = 2,
}) {
  const values = showAll
    ? attrArray
    : attrArray.slice(0, maxLength);
  return (
    <ul>
      {
        values.map((value) => (
          <li key={value} className="list-group-item py-0 px-0">
            <DetailedSingleAttribute
              value={String(value)}
            />
          </li>
        ))
      }
      {
        attrArray.length > maxLength
        && (
          <li>
            <button
              type="button"
              className="is-link"
              onClick={toggleShowAll}
            >
              <small>
                {
                  showAll
                    ? 'Show less'
                    : `Show ${attrArray.length - maxLength} more ...`
                }
              </small>
            </button>
          </li>
        )
      }
    </ul>
  );
}

/*
function SingleAttributeValue({
  attributeValue, showAll, toggleShowAll, maxLength = 100,
}) {
  // const [description, setDescription] = useState('');
  const attrVal = String(attributeValue);
  const value = showAll || attrVal.length <= maxLength
    ? attrVal
    : `${attrVal.slice(0, maxLength)}...`;

  return (
    <>
      <p className="mb-1">
        <DetailedSingleAttribute value={value} />
      </p>
      {
        attrVal.length > maxLength
        && (
          <button
            type="button"
            className="is-link"
            onClick={toggleShowAll}
          >
            <small>{showAll ? 'Show less' : 'Show more ...'}</small>
          </button>
        )
      }
    </>
  );
}
*/

export default function AttributeValue({ attributeValue }) {
  const [showAll, setShowAll] = useState(false);
  function toggleShowAll() {
    setShowAll(!showAll);
  }

  if (typeof attributeValue === 'undefined') {
    return <p />;
  }

  const attrArray = isArray(attributeValue)
    ? attributeValue
    : [attributeValue];

  return (
    <AttributeValueArray
      attrArray={attrArray}
      showAll={showAll}
      toggleShowAll={toggleShowAll}
    />
  );
}
