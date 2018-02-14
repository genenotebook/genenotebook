import { withTracker } from 'meteor/react-meteor-data';

import React from 'react'

class Orthogroup extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div id="orthogroup">
      </div>
    )
  }
}

export default withTracker(props => {
  return {
    gene: props.gene
  }
})(Orthogroup);