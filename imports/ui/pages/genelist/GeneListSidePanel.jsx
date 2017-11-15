import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { isEmpty, without, cloneDeep, mapObject } from 'lodash';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';

const ThreewayRadio = props => {
  console.log(props)
  const options = {
    'yes': {
      labelClass: 'btn btn-outline-success',
      iconClass: 'fa fa-check' 
    },
    'no': {
      labelClass: 'btn btn-outline-danger',
      iconClass: 'fa fa-remove'
    },
    'either': {
      labelClass: 'btn btn-outline-secondary active',
      iconClass: 'fa fa-dot-circle-o'
    }
  };
  return (
    <div className="threeway-radio row justify-content-between" >
      <label htmlFor={props.attribute}>{props.attribute} </label>
      <div 
        className="btn-group btn-group-sm float-right" 
        id={props.attribute} 
        data-toggle="buttons" >
        {
          Object.entries(options).map(opt => {
            const [option, params] = opt;
            const { labelClass, iconClass } = params;
            return (
              <label key={option} className={params.labelClass} >
                <input
                  key={option} 
                  type="radio" 
                  autoComplete="off" 
                  id={props.attribute} 
                  onChange={()=>{alert('click')}} 
                  value={option} />
                <i className={params.iconClass} aria-hidden="true" />
              </label>
            )
          })
        }
      </div>
    </div>
  )
}


class GeneListSidePanel extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selectedAttributes: new Set(['Name','Comment','expression'])
    }
  }

  handleTrackSelect = event => {
    const trackName = event.target.id;
    const checked = event.target.checked;
    const query = cloneDeep(this.props.query);
    if ( checked && query.hasOwnProperty('track') ){
      query.track['$in'].push(trackName)
    } else if (checked && !query.hasOwnProperty('track')) {
      query.track = { $in: [trackName] };
    } else if ( !checked && query.hasOwnProperty('track')) {
      query.track['$in'] = without(query.track['$in'], trackName)
      if (query.track['$in'].length === 0) {
        delete query.track
      }
    } else if (!checked && !query.hasOwnProperty('track')) {
      //THIS SHOULD NEVER HAPPEN
      alert('Something went wrong with track selection!')
    }
    this.props.updateQuery(query)
  }

  handleAttributeSelect = event => {
    const attribute = event.target.id;
    const selectedAttributes = cloneDeep(this.state.selectedAttributes)
    if (selectedAttributes.has(attribute)){
      selectedAttributes.delete(attribute)
    } else {
      selectedAttributes.add(attribute)
    }
    this.setState({
      selectedAttributes: selectedAttributes
    })
  }

  filterAttributes = event => {
    const attribute = event.target.id;
    const select = event.target.value;
    const query = cloneDeep(this.props.query);
    console.log(attribute,select)
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
                        <input 
                          type="checkbox" 
                          className="track-checkbox" 
                          id={track.trackName} 
                          onClick={this.handleTrackSelect}/>
                        &nbsp;{track.trackName}
                      </label>
                    </div>
                  )
                })
              }
            </li>
            

            
            <li className="list-group-item">
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary btn-sm dropdown-toggle pull-right" 
                  type="button" 
                  data-toggle="dropdown" 
                  aria-haspopup="true" 
                  aria-expanded="false" 
                  id="attributemenu-button" >
                  Select
                </button>
                <ul 
                  className="dropdown-menu scrollable-menu pull-right" 
                  role="menu" 
                  aria-labelledby="attributemenu-button" >
                  { 
                    this.props.attributes.map(attribute => {
                      const active = this.state.selectedAttributes.has(attribute.name) ? 'active' : ''
                      return (
                        <li key={attribute._id} role="presentation" >
                          <a 
                            role="menuitem" 
                            className={`dropdown-item attributemenu-item ${active}`}
                            id={attribute.name}
                            onClick={this.handleAttributeSelect} >
                            {attribute.name}
                          </a>
                        </li>
                      )
                    })
                  }
                </ul>
              </div>
              <label className="font-weight-bold">Attributes</label>
              {
                Array.from(this.state.selectedAttributes).map(attribute => {
                  return <ThreewayRadio 
                    key={attribute} 
                    attribute={attribute}
                    onClick={this.filterAttributes} />
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
    query: props.query,
    updateQuery: props.updateQuery,
    tracks: Tracks.find({}).fetch(),
    attributes: Attributes.find({}).fetch(),
    loading: !trackSub.ready() || !attributeSub.ready()
  }
})(GeneListSidePanel)