import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

import { ReferenceInfo } from '/imports/api/genomes/reference_collection.js';

class AdminGenomes extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      this.props.loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <ul className='list-group'>
        {
          this.props.genomes.map(genome => {
            console.log(genome)
            return (
              <li className='list-group-item' key={genome._id}>
                <p>
                  <a href={`/admin/reference/${genome.referenceName}`}> {genome.referenceName} </a>
                  <small>{`${genome.organism} -- ${genome.description}`}</small>
                </p>
              </li>
            )
          })
        }
        </ul>
      </div>
    )
  }
}

export default createContainer(()=>{
  const subscription = Meteor.subscribe('referenceInfo')
  return {
    genomes: ReferenceInfo.find({}).fetch(),
    loading: !subscription.ready()
  }
},AdminGenomes)