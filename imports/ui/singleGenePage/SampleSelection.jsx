import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';

const dataTracker = ({ gene, children }) => {
  const { genomeId } = gene;
  const experimentSub = Meteor.subscribe('experimentInfo');
  const loading = !experimentSub.ready()
  const experiments = ExperimentInfo.find({ genomeId }).fetch();
  const replicaGroups = groupBy(experiments, 'replicaGroup');
  return {
    loading,
    experiments,
    children,
    replicaGroups
  }
}

class SampleSelection extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      options: [{value:'loading',label:'loading...'}],
      selection: [{value:'loading',label:'loading...'}]
    }
  }
  componentWillReceiveProps = ({ replicaGroups }) => {
    const options = Object.keys(replicaGroups).map(replicaGroup => {
      return {
        value: replicaGroup,
        label: replicaGroup
      }
    })
    //const selection = options.map(option => option.value)
    const selection = options.slice(0, 10);
    this.setState({
      options,
      selection
    })
  }

  updateSelection = newSelection => {
    const newState = update(this.state, {
      selection: {
        $set: newSelection//.map( selection => selection.value)
      }
    })
    this.setState(newState)
  }

  renderChildren = () => {
    const { selection } = this.state;
    const { replicaGroups, gene, children } = this.props;
    const _samples = selection.map(({ value }) => {
      return replicaGroups[value].map(sample => {
        return sample
      })
    })
    const samples = [].concat(..._samples);

    return React.Children.map(children, child => {
      return React.cloneElement(child, {
        samples,
        gene 
      })
    })
  }

  render(){
    const { loading } = this.props;
    const { selection, options } = this.state;
    return (
      <div>
        <Select isMulti value={selection} closeMenuOnSelect={false}
          options={options} onChange={this.updateSelection} />
        {
          !loading && this.renderChildren()
        }
      </div>
    )
  }
}

export default withTracker(dataTracker)(SampleSelection);