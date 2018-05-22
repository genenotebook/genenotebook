import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

const dataTracker = ({ ...props }) => {
  return {
    props
  }
}

class ExpressionDownloadOptions extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div></div>
    )
  }
}

export default withTracker(dataTracker)(ExpressionDownloadOptions)