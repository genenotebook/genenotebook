import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';
import { scanGeneAttributes } from '/imports/api/genes/scan_attributes.js';

class AdminAttributes extends React.Component {
  constructor(props){
    super(props)
  }

  scanAttributes = (event) => {
    event.preventDefault();
    console.log('clicked scanAttributes')
    this.props.tracks.forEach(track => {
      console.log(track)
      const trackId = track._id;
      scanGeneAttributes.call({ trackId })
    })
  }

  render(){
    const { loading, attributes, ...props } = this.props;
    return (
      loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <button type='button' className='btn btn-warning' onClick={this.scanAttributes}>
          <i className="fa fa-warning" aria-hidden="true"/> Scan all genes for attributes
        </button>
        <hr/>
        <table className="table table-hover table-sm">
          <thead>
          <tr>
            {
              ['Name','Query','Visible','Can edit','References','Actions'].map(label => {
                return <th key={label} scope='col'>
                  <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2' disabled>
                    { label }
                  </button>
                </th>
              })
            }
          </tr>
        </thead>
        <tbody>
        {
          attributes.map(attribute => {
            return (
              <tr key={attribute._id}>
                <td>{attribute.name}</td>
                <td>{attribute.query}</td>
                <td>{attribute.show}</td>
                <td>{attribute.canEdit}</td>
                <td>{attribute.references ? attribute.references : attribute.allReferences}</td>
                <td>
                  <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2'>Edit</button>
                </td>
              </tr>
            )
          })
        }
        </tbody>
        </table>
        {/*
        <ul className='list-group'>
        {
          this.props.attributes.map(attribute => {
            return (
              <li className='list-group-item' key={attribute._id}>
                <p>
                  <a href={`/admin/attribute/${attribute.name}`}> {attribute.name} </a>
                </p>
                <ul className='list-group'>
                  <li className='list-group-item'>
                    <small>{`Show: ${attribute.show}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>{`Can edit: ${attribute.canEdit}`}</small>
                  </li>
                  {
                    attribute.allReferences &&
                    <li className='list-group-item'>
                      <small>{`All references: ${attribute.allReferences}`}</small>
                    </li>
                  }
                  {
                    attribute.references &&
                    <li className='list-group-item'>
                      <small>{`References: ${attribute.references}`}</small>
                    </li>
                  }
                </ul>
              </li>
            )
          })
        }
        </ul>
      */}
      </div>
    )
  }
}

export default withTracker(props => {
  const attributeSubscription = Meteor.subscribe('attributes');
  const trackSubscription = Meteor.subscribe('tracks');
  return {
    attributes: Attributes.find({}).fetch(),
    tracks: Tracks.find({}).fetch(),
    loading: !attributeSubscription.ready() || !trackSubscription.ready()
  }
})(AdminAttributes)