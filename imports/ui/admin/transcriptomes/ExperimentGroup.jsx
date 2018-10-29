import React from 'react';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import SampleInfo from './SampleInfo.jsx';

export default class ExperimentGroup extends React.Component {
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
    const replicaGroups = groupBy(this.props.samples, 'replicaGroup');

    return (
      <ul className='list-group'>
        {
          Object.entries(replicaGroups).map(entry => {
            const [groupName, groupSamples] = entry;
            const expanded = this.state.expanded.indexOf(groupName) >= 0;
            return <li key={groupName} className='list-group-item replica-group'>
              <input 
                type='submit' 
                className='fa btn btn-sm btn-outline-dark' 
                value={ expanded ? '\uf068' : '\uf067' }
                id={groupName}
                onClick={this.toggleExpand} />
              <small className='text-muted'>&nbsp;Replica group: </small>
              {groupName} 
              <span className='badge badge-dark pull-right'>{groupSamples.length} samples</span>
              
              {
                expanded && 
                <ul className='list-group'>
                  {
                    groupSamples.map(sample => {
                      return <SampleInfo 
                        key={sample._id} 
                        sample={sample} 
                        allSamples={this.props.allSamples}
                        roles={this.props.roles}
                      />
                    })
                  }
                </ul>
              }
            </li>
          })
        }
      </ul>
    )
  }
}