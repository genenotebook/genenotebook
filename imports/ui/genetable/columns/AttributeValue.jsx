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
    <ul>
      {
        values.map((value) => (
          <li key={value}>
            { value }
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
      <p>{ value }</p>
      {
        attrVal.length > maxLength
        && (
        <button
          type="button"
          className="is-link"
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
