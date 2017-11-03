import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

class ThreewayCheckbox extends React.Component {
  constructor(props){
    super(props)
    this.state {
      checkedState: 'unchecked'
    }
    render(){
      return (
        <div className={this.props.className}>
          <input type="checkbox" className="ternary-toggle attribute-checkbox" id={attribute} />
          <label htmlFor={attribute}>
            {attribute}
          </label>
        </div>
      )
    }
  }
}

class GenelistFilterOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selectedAttributes: ['Name','Comments']
    }
  }

  render(){
    return (
      <form role="form" id="genelist_filter" autoComplete="off">
      <div className="panel panel-default">
        <div className="panel-heading clearfix">
            <button className="btn btn-sm pull-right" type="button">
              <i className="fa fa-arrow-left" aria-hidden="true"></i>
            </button>
            {/*{#if hasFilter}}
              <button type="button" class="btn btn-danger btn-sm reset_filter">
                <span class="glyphicon glyphicon-remove-circle" aria-hidden="true"></span> Clear filters
              </button>
            {{/if}*/}
          <p></p>
        </div>
        <ul className="filter list-group">
          <li className="list-group-item">
            <ul className="nav nav-tabs" id="feature-nav" data-spy="affix">
              <li role="presentation" className="active"><a href="#">Filter options</a></li>
              <li role="presentation"><a href="#">Display options</a></li>
            </ul>
          </li>
          
          <li className="list-group-item">
            <label htmlFor="gene_id_filter">Gene IDs</label>
            <textarea className="form-control" id="gene_id_filter" type="text" />
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
                  <div key={track.trackName} className="checkbox">
                    <input type="checkbox" className="track-checkbox" id={track.trackName} />
                    <label htmlFor={track.trackName}>{track.trackName}</label>
                  </div>
                )
              })
            }
          </li>
          

          
          <li className="list-group-item">
            <div className="dropdown">
              <button className="btn btn-default btn-sm dropdown-toggle pull-right" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="attributemenu-button">
                <i className="fa fa-plus" aria-hidden="true"></i>
              </button>
              <ul className="dropdown-menu scrollable-menu pull-right" role="menu" aria-labelledby="attributemenu-button">
                {
                  this.props.attributes.map(attribute => {
                    return (
                      <li key={attribute} role="presentation" >
                        <a role="menuitem" className="dropdown-item attributemenu-item">{attribute}</a>
                      </li>
                    )
                  })
                }
              </ul>
            </div>
            <label>Attributes</label>
            {
              this.state.selectedAttributes.map(attribute => {
                return (
                  <div key={attribute} className="checkbox">
                    <input type="checkbox" className="ternary-toggle attribute-checkbox" id={attribute} />
                    <label htmlFor={attribute}>
                      {attribute}
                    </label>
                  </div>
                )
              })
            }
          </li>
        </ul>
        </div>
      </form>
    )
  }
}

export default withTracker((props) => {
  return {
    tracks: [],
    attributes: []
  }
})(GenelistFilterOptions)