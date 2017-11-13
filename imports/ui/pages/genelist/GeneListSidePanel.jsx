import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { isEmpty } from 'lodash';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';

const ThreewayCheckbox = props => {
  return (
    <div>
      <label htmlFor={props.attribute}>{props.attribute} </label>
      <div className="btn-group btn-group-sm float-right" id={props.attribute} data-toggle="buttons">
        <label className="btn btn-outline-success">
          <input type="radio" autoComplete="off" />
          <i className="fa fa-check" aria-hidden="true" />
        </label>
        <label className="btn btn-outline-danger">
          <input type="radio" autoComplete="off" />
          <i className="fa fa-remove" aria-hidden="true" />
        </label>
        <label className="btn btn-outline-secondary active">
          <input type="radio" autoComplete="off" />
          <i className="fa fa-circle-o" aria-hidden="true" />
        </label>
      </div>
    </div>
  )
}



class GeneListSidePanel extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selectedAttributes: ['Name','Comments','Expression'],
      filter: {}
    }
  }

  render(){
    return (
      <div>
        <div className="row justify-content-end">
          { 
            isEmpty(this.state.filter) &&
            <button type="button" className="btn btn-danger btn-sm float-right">
              <span className="fa fa-remove-o" aria-hidden="true"></span> Clear filters
            </button>
          }
          <button className="btn btn-sm btn-outline-secondary float-right" type="button">
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
          </button>
        </div>
        <div className="card row">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a className="nav-link active">Filter options</a>
              </li>
              <li className="nav-item">
                <a className="nav-link">Display options</a>
              </li>
            </ul>
          </div>
          <ul className="filter list-group">

            <li className="list-group-item">
              <label htmlFor="gene_id_filter">Gene IDs</label>
              <textarea className="form-control" id="gene_id_filter" type="text" rows="3" />
            </li>
            

            
            <li className="list-group-item">
              <label htmlFor="orthogroup_filter">Orthogroup</label>
              <input type="text" className="form-control" id="orthogroup_filter" />
            </li>
            

            
            <li className="list-group-item">
              <label>Tracks</label>
              {
                this.props.tracks.map(track => {
                  return (
                    <div key={track._id} className="form-check">
                      <label className="form-check-label" htmlFor={track.trackName}>
                        <input type="checkbox" className="track-checkbox" id={track.trackName} />
                        &nbsp;{track.trackName}
                      </label>
                    </div>
                  )
                })
              }
            </li>
            

            
            <li className="list-group-item">
              <div className="dropdown">
                <button className="btn btn-outline-secondary btn-sm dropdown-toggle pull-right" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="attributemenu-button">
                  Select
                </button>
                <ul className="dropdown-menu scrollable-menu pull-right" role="menu" aria-labelledby="attributemenu-button">
                  {
                    this.props.attributes.map(attribute => {
                      return (
                        <li key={attribute._id} role="presentation" >
                          <a role="menuitem" className="dropdown-item attributemenu-item">{attribute.name}</a>
                        </li>
                      )
                    })
                  }
                </ul>
              </div>
              <label className="font-weight-bold">Attributes</label>
              {
                this.state.selectedAttributes.map(attribute => {
                  return <ThreewayCheckbox 
                    key={attribute} 
                    attribute={attribute} 
                    handleClick={this.handleAttributeSelection} />
                })
              }
            </li>
          </ul>
          </div>
        </div>
    )
  }
}

export default withTracker(props => {
  const trackSub = Meteor.subscribe('tracks');
  const attributeSub = Meteor.subscribe('attributes');
  return {
    tracks: Tracks.find({}).fetch(),
    attributes: Attributes.find({}).fetch(),
    loading: !trackSub.ready() || !attributeSub.ready()
  }
})(GeneListSidePanel)