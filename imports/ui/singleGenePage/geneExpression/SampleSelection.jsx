import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select, { components } from 'react-select';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import logger from '/imports/api/util/logger.js';

import { Dropdown, DropdownMenu, DropdownButton } from '/imports/ui/util/Dropdown.jsx';

import './sampleSelection.scss';

function dataTracker({ gene, children }) {
  const { genomeId } = gene;
  const experimentSub = Meteor.subscribe('experimentInfo');
  const loading = !experimentSub.ready();
  const experiments = ExperimentInfo.find({ genomeId }).fetch();
  const replicaGroups = groupBy(experiments, 'replicaGroup');
  return {
    loading,
    experiments,
    children,
    replicaGroups
  }
}

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minWidth: 200,
    margin: 4
  }),
  menu: (provided, state) => ({
    boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.1)'
  })
}

function DropdownIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <span className='icon-search' />
    </components.DropdownIndicator>
  )
}

class SampleSelection extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      options: [],
      selection: []
    }
  }

  componentWillReceiveProps = ({ replicaGroups }) => {
    const options = Object.keys(replicaGroups).map(replicaGroup => {
      return {
        value: replicaGroup,
        label: replicaGroup
      }
    })
    const selection = options.slice(0, 10);
    this.setState({
      options,
      selection
    })
  }

  updateSelection = newSelection => {
    logger.debug(newSelection)
    const newState = update(this.state, {
      selection: {
        $set: newSelection
      }
    })
    this.setState(newState)
  }

  selectAll = () => {
    this.setState({
      selection: this.state.options
    })
  }

  unselectAll = () => {
    this.setState({
      selection: []
    })
  }

  renderChildren = () => {
    const { selection } = this.state;
    const { replicaGroups, gene, children, loading } = this.props;
    const _samples = selection.map(({ value }) => {
      return replicaGroups[value].map(sample => {
        return sample
      })
    })
    const samples = [].concat(..._samples);

    return React.Children.map(children, child => {
      return React.cloneElement(child, {
        samples,
        gene,
        loading 
      })
    })
  }

  render(){
    const { loading } = this.props;
    const { selection, options } = this.state;
    return <div>
      <div className='d-flex sample-select'>
        <Dropdown>
          <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border">
            Select samples&nbsp;
            <span className='badge badge-dark'>
              {
                loading ?
                '...' :
                `${selection.length} / ${options.length}`
              }
            </span>
          </DropdownButton>
          <DropdownMenu className='dropdown-menu-right pt-0'>
            <div className='btn-group btn-group-sm mx-1 my-1 d-flex justify-content-end' 
              role='group'>
              <button className='btn btn-sm btn-outline-dark px-2 py-0 border' 
                type='button' onClick={this.selectAll}>
                Select all
              </button>
              <button className='btn btn-sm btn-outline-dark px-2 py-0 border' 
                type='button' onClick={this.unselectAll}>
                Unselect all
              </button>
            </div>
            <Select 
              autoFocus
              backSpaceRemovesValue={false}
              closeMenuOnSelect={false}
              components={{ DropdownIndicator, IndicatorSeparator: null }}
              controlShouldRenderValue={false}
              hideSelectedOptions={false}
              isClearable={false}
              isMulti
              menuIsOpen
              onChange={this.updateSelection}
              options={options} 
              placeholder='Search...'
              styles={customStyles}
              tabSelectsValue={false} 
              value={selection}
              noOptionsMessage={()=>{return 'No expression data'}} />
          </DropdownMenu>
        </Dropdown>
      </div>
      <div>
        {
          this.renderChildren()
        }
      </div>
    </div>
  }
}

export default withTracker(dataTracker)(SampleSelection);