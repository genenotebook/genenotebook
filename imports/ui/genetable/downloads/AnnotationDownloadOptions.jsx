import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

const dataTracker = ({ ...props }) => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();
  return {
    loading, attributes, ...props,
  };
};

function AnnotationDownloadOptions() {
  return (
    <div />
  );
}

export default withTracker(dataTracker)(AnnotationDownloadOptions);
