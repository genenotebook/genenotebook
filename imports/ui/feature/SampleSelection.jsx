import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';

class SampleSelection extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      options: [],
      selection: []
    }
  }
  componentWillReceiveProps = nextProps => {
    console.log(nextProps)
    const options = Object.keys(nextProps.replicaGroups).map(replicaGroup => {
      return {
        value: replicaGroup,
        label: replicaGroup
      }
    })
    const selection = options.map(option => option.value)
    this.setState({
      options,
      selection
    })
  }

  updateSelection = newSelection => {
    const newState = update(this.state, {
      selection: {
        $set: newSelection.map( selection => selection.value)
      }
    })
    this.setState(newState)
  }

  renderChildren = () => {
    const samples = this.state.selection.map(replicaGroupId => {
      return this.props.replicaGroups[replicaGroupId].map(sample => {
        return sample
      })
    })

    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        samples: [].concat(...samples),
        gene: this.props.gene 
      })
    })
  }

  render(){
    return (
      <div>
        <Select 
          multi={true}
          value={this.state.selection}
          options={this.state.options}
          onChange={this.updateSelection} 
        />
        {
          this.renderChildren()
        }
      </div>
    )
  }
}

export default withTracker(props => {
  const experimentSub = Meteor.subscribe('experimentInfo');
  const experiments = ExperimentInfo.find({
    track: props.gene.track
  }).fetch();
  const replicaGroups = groupBy(experiments, 'replicaGroup');
  return {
    loading: !experimentSub.ready(),
    experiments: experiments,
    children: props.children,
    replicaGroups: replicaGroups
  }
})(SampleSelection);