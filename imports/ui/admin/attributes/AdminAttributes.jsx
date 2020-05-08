/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { attributeCollection }
  from '/imports/api/genes/attributeCollection.js';
import { genomeCollection }
  from '/imports/api/genomes/genomeCollection.js';
import { scanGeneAttributes }
  from '/imports/api/genes/scanGeneAttributes.js';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

import AttributeInfo from './AttributeInfo.jsx';

function attributeDataTracker() {
  const attributeSub = Meteor.subscribe('attributes');
  const attributes = attributeCollection.find({}).fetch();
  const genomeSub = Meteor.subscribe('genomes');
  const genomes = genomeCollection.find({}).fetch();
  const loading = !attributeSub.ready() || !genomeSub.ready();
  return {
    attributes,
    genomes,
    loading,
  };
}

function AdminAttributes({ attributes, genomes }) {
  function scanAttributes(event) {
    event.preventDefault();
    genomes.forEach(({ _id: genomeId }) => {
      scanGeneAttributes.call({ genomeId });
    });
  }
  return (
    <div>
      <article className="message is-warning">
        <div className="message-body">
          <button
            type="button"
            className="button is-warning"
            onClick={scanAttributes}
          >
            <span className="icon-exclamation" aria-hidden="true" />
            Scan all genes for attributes
          </button>
          <p>
            This triggers a map-reduce that can take a while
          </p>
        </div>
      </article>
      <table className="table is-small is-hoverable is-fullwidth">
        <thead>
          <tr>
            {[
              'Name',
              'Query',
              'Display default',
              'Search default',
              'Actions',
            ].map((label) => (
              <th key={label} scope="col">
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
          {attributes.map((attribute) => (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <AttributeInfo key={attribute._id} {...attribute} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default compose(
  withTracker(attributeDataTracker),
  branch(isLoading, Loading),
)(AdminAttributes);
