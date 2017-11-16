import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { isEmpty, without, cloneDeep, mapObject } from 'lodash';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';

import AttributeSelect from './AttributeSelect.jsx';
import TrackSelect from './TrackSelect.jsx';
import GeneIdSelect from './GeneIdSelect.jsx';


class GeneListSidePanel extends React.Component {
  constructor(props){
    super(props);
  }

  updateTrackFilter = event => {
    const trackName = event.target.id;
    const checked = event.target.checked;
    const query = cloneDeep(this.props.query);
    
    if (!query.hasOwnProperty('track')){
      query.track = {$in: []}
    }

    if (checked){
      query.track['$in'].push(trackName)
    } else {
      query.track['$in'] = without(query.track['$in'], trackName)
    }

    if (query.track['$in'].length === 0){
      delete query.track
    }
    
    this.props.updateQuery(query)
  }

  updateAttributeFilter = (attribute, value) => {
    const query = cloneDeep(this.props.query);
    const directProps = ['viewing','editing'];
    const attributeQuery = directProps.indexOf(attribute) > 0 ? attribute : `attributes.${attribute}`;
    console.log(attribute,value)
    if (value === 'either'){
      delete query[attributeQuery]
    } else if (value === 'yes') {
      query[attributeQuery] = {$exists: true}
    } else if (value === 'no') {
      query[attributeQuery] = {$exists: false}
    }
    this.props.updateQuery(query)
  }

  updateGeneIdFilter = geneIds => {
    const query = cloneDeep(this.props.query);
    query.ID = {$in: geneIds}
    this.props.updateQuery(query)
  }

  render(){
    return (
      <div>
        <div className="row justify-content-end">
          { 
            !isEmpty(this.props.query) &&
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
              <GeneIdSelect updateGeneIdFilter={this.updateGeneIdFilter} />
            </li>

            <li className="list-group-item">
              <label htmlFor="orthogroup_filter">Orthogroup</label>
              <input type="text" className="form-control" id="orthogroup_filter" />
            </li>

            <li className="list-group-item">
              <TrackSelect 
                tracks={this.props.tracks} 
                updateTrackFilter={this.updateTrackFilter} />
            </li>

            <li className="list-group-item">
              <AttributeSelect 
                attributes={this.props.attributes} 
                updateAttributeFilter={this.updateAttributeFilter} />
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
    query: props.query,
    updateQuery: props.updateQuery,
    tracks: Tracks.find({}).fetch(),
    attributes: Attributes.find({}).fetch(),
    loading: !trackSub.ready() || !attributeSub.ready()
  }
})(GeneListSidePanel)