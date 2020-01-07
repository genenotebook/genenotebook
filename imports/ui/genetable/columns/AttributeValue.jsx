import React, { useState } from 'react';

function isArray(x) {
  return Array.isArray(x) && x.length > 1;
}

function AttributeValueArray({
  attributeValue, showAll, toggleShowAll, maxLength = 2,
}) {
  const values = showAll ? attributeValue : attributeValue.slice(0, maxLength);
  const buttonText = showAll ? 'Show less' : 'Show more ...';
  return (
    <ul className="list-group list-group-flush">
      {
        values.map((value) => (
          <li key={value} className="list-group-item py-0 px-0">
            { value }
          </li>
        ))
      }
      {
        attributeValue.length > maxLength
        && (
        <li className="list-group-item py-0 px-0">
          <button
            type="button"
            className="btn btn-link px-3"
            onClick={toggleShowAll}
          >
            <small>{ buttonText }</small>
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
  const attrVal = String(attributeValue);
  const value = showAll || attrVal.length <= maxLength
    ? attrVal
    : `${attrVal.slice(0, maxLength)}...`;

  const buttonText = showAll ? 'Show less' : 'Show more ...';
  return (
    <>
      <p className="mb-1">{ value }</p>
      {
        attrVal.length > maxLength
        && (
        <button
          type="button"
          className="btn btn-link px-3 py-0"
          onClick={toggleShowAll}
        >
          <small>{ buttonText }</small>
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
    return <p className="mb-1" />;
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
