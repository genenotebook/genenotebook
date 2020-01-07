import React from 'react';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import ExperimentGroup from './ExperimentGroup.jsx';

export default class TrackExperiments extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      expanded: []
    }
  }

  toggleExpand = event => {
    const groupName = event.target.id;
    const index = this.state.expanded.indexOf(groupName)
    const operation = index < 0 ? { $push: [groupName] } : { $splice : [[index]] };
    const newState = update(this.state, { expanded: operation })
   
    this.setState(newState);
  }

  render(){
    const experimentGroups = groupBy(this.props.samples, 'experimentGroup');

    return (
      <ul className='list-group'>
        {
          Object.entries(experimentGroups).map(entry => {
            const [groupName, groupSamples] = entry;
            const expanded = this.state.expanded.indexOf(groupName) >= 0;
            return (
              <li key={groupName} className='list-group-item experiment-group'>
                <input 
                  type='submit' 
                  className='fa btn btn-sm btn-outline-dark' 
                  value={ expanded ? '\uf068' : '\uf067' }
                  id={groupName}
                  onClick={this.toggleExpand} />
                <small className='text-muted'>&nbsp;Experiment group: </small>
                {groupName} 
                <span className='badge badge-dark pull-right'>{groupSamples.length} samples</span>
                {
                  expanded && 
                  <ExperimentGroup 
                    samples={groupSamples} 
                    allSamples={this.props.samples}
                    roles={this.props.roles}
                    />
                }
              </li>
            )
          })
        }
      </ul>
    )
  }
}