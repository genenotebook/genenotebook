/* eslint-disable jsx-a11y/label-has-associated-control */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

const dataTracker = ({ ...props }) => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading, attributes, ...props,
  };
};

function AnnotationDownloadOptions({
  loading, attributes, options, updateOptions,
}) {
  if (loading) { return <div>Loading options</div>; }
  const [initialized, setInitialized] = useState(false);
  const { seqType, fileFormat, primaryTranscriptOnly } = options;
  if (!initialized) {
    updateOptions({
      fileFormat: '.gff3',
      primaryTranscriptOnly: true,
    });
    setInitialized(true);
    return <div>Loading options</div>;
  }
  return (
    <form>
      <div className="field">
        <label className="label">
          File format
        </label>
        <div className="control">
          <label className="checkbox">
            <input
              className="form-check-input"
              type="checkbox"
              id="file-format"
              defaultChecked
              disabled
            />
            {fileFormat}
          </label>
        </div>
      </div>
    </form>
  );
}

export default withTracker(dataTracker)(AnnotationDownloadOptions);
