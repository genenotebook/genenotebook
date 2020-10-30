import React, { useState } from 'react';

function isArray(x) {
  return Array.isArray(x) && x.length > 1;
}

function DetailedSingleAttribute({ value }) {
  const [description, setDescription] = useState('');

  let url;

  if (/^(GO:[0-9]{7})$/.test(value)) {
    url = `http://amigo.geneontology.org/amigo/term/${value}`;
    fetch(`http://api.geneontology.org/api/bioentity/${value}`)
      .then((res) => res.json())
      .then((data) => {
        setDescription(data.label);
      })
      .catch(console.log);
  } else if (/^(InterPro:IPR[0-9]{6})$/.test(value)) {
    url = `https://www.ebi.ac.uk/interpro/entry/${value.replace('InterPro:', '')}`;
    fetch(`https://www.ebi.ac.uk/interpro/api/entry/interpro/${value.replace('InterPro:', '')}`)
      .then((res) => res.json())
      .then((data) => {
        setDescription(data.metadata.name.name);
      })
      .catch(console.log);
  }

  if (typeof url !== 'undefined') {
    value = (
      <a href={url}>{value}</a>
    );
  }

  return (
    <>
      { value}
      {' '}
      {description}
    </>
  );
}

function AttributeValueArray({
  attributeValue, showAll, toggleShowAll, maxLength = 2,
}) {
  const values = showAll ? attributeValue : attributeValue.slice(0, maxLength);
  const buttonText = showAll ? 'Show less' : 'Show more ...';
  return (
    <ul>
      {
        values.map((value) => (
          <li key={value} className="list-group-item py-0 px-0">
            <DetailedSingleAttribute
              value={value}
            />
          </li>
        ))
      }
      {
        attributeValue.length > maxLength
        && (
          <li>
            <button
              type="button"
              className="is-link"
              onClick={toggleShowAll}
            >
              <small>{buttonText}</small>
            </button>
          </li>
        )
      }
    </ul>
  );
}

function SingleAttributeValue({
  attributeValue, showAll, toggleShowAll, maxLength = 100,
}) {
  const [description, setDescription] = useState('');
  const attrVal = String(attributeValue);
  const value = showAll || attrVal.length <= maxLength
    ? attrVal
    : `${attrVal.slice(0, maxLength)}...`;

  const buttonText = showAll ? 'Show less' : 'Show more ...';
  return (
    <>
      <p className="mb-1">
        <DetailedSingleAttribute
          value={value}
        />

      </p>
      {
        attrVal.length > maxLength
        && (
          <button
            type="button"
            className="is-link"
            onClick={toggleShowAll}
          >
            <small>{buttonText}</small>
          </button>
        )
      }
    </>
  );
}

export default function AttributeValue({ attributeValue }) {
  const [showAll, setShowAll] = useState(false);
  function toggleShowAll() {
    setShowAll(!showAll);
  }

  if (typeof attributeValue === 'undefined') {
    return <p />;
  }

  const AttributeValueComponent = isArray(attributeValue)
    ? AttributeValueArray
    : SingleAttributeValue;

  return (
    <AttributeValueComponent
      attributeValue={attributeValue}
      showAll={showAll}
      toggleShowAll={toggleShowAll}
    />
  );
}
