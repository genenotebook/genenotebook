import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Attributes } from '/imports/api/genes/attribute_collection.js';

const dataTracker = ({ ...props }) => {
  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = Attributes.find({}).fetch();
  return {
    loading, attributes, ...props
  }
}

class AnnotationDownloadOptions extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    return (
      <div></div>
    )
  }
}

export default withTracker(dataTracker)(AnnotationDownloadOptions);