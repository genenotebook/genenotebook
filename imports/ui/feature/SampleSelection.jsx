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
      options: [{value:'loading',label:'loading...'}],
      selection: ['loading']
    }
  }
  componentWillReceiveProps = nextProps => {
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
    const { selection } = this.state;
    const { replicaGroups, gene } = this.props;
    const _samples = selection.map(replicaGroupId => {
      return replicaGroups[replicaGroupId].map(sample => {
        return sample
      })
    })
    const samples = [].concat(..._samples);

    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        samples,
        gene 
      })
    })
  }

  render(){
    const { loading } = this.props;
    return (
      <div>
        <Select 
          multi={true}
          value={this.state.selection}
          options={this.state.options}
          onChange={this.updateSelection} 
        />
        {
          !loading && this.renderChildren()
        }
      </div>
    )
  }
}

export default withTracker(({ gene, children }) => {
  const { trackId } = gene;
  const experimentSub = Meteor.subscribe('experimentInfo');
  const loading = !experimentSub.ready()
  const experiments = ExperimentInfo.find({ trackId }).fetch();
  const replicaGroups = groupBy(experiments, 'replicaGroup');
  return {
    loading,
    experiments,
    children,
    replicaGroups
  }
})(SampleSelection);