import React from 'react';
import Select from 'react-select';

import { withTracker } from 'meteor/react-meteor-data';

class SampleSelection extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <Select value='all' />
    )
  }
}

export default withTracker(SampleSelection, {
  return {
    loading: false
  }
})(SampleSelection)