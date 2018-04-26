import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { compose } from 'recompose';
import React from 'react';
import { cloneDeep } from 'lodash';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { Tracks } from '/imports/api/genomes/track_collection.js';

const tracksDataTracker = ({...props}) => {
  const trackSub = Meteor.subscribe('tracks');
  const loading = !trackSub.ready();
  const tracks = Tracks.find({}).fetch();
  return {
    loading,
    tracks,
    ...props
  }
}

const withConditionalRendering = compose(
  withTracker(tracksDataTracker),
  withEither(isLoading, Loading)
)

class TrackSelect extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      initialized: false,
      show: '',
      selectedTracks: new Set()
    }
  }

  componentWillReceiveProps = newProps => {
    if (!this.state.initialized){
      const tracks = newProps.tracks.map(track => track.trackName);
      this.setState({
        selectedTracks: new Set(tracks),
        initialized: true
      })
    }
  }

  open = () => {
    console.log('open')
    this.setState({
      show: 'show'
    });
    document.addEventListener('click', this.close);
  }

  close = () => {
    this.setState({
      show: ''
    });
    document.removeEventListener('click', this.close);
  }

  preventClose = event => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  toggleTrackSelect = event => {
    const selectedTracks = cloneDeep(this.state.selectedTracks);
    const query = cloneDeep(this.props.query);
    const track = event.target.id;
    if (selectedTracks.has(track)){
      selectedTracks.delete(track)
    } else {
      selectedTracks.add(track)
    }
    
    this.setState({
      selectedTracks: selectedTracks
    })

    if (selectedTracks.size < this.props.tracks.length){
      query.track = { $in: [...selectedTracks]}
    } else if (query.hasOwnProperty('track')){
      delete query.track;
    }

    this.props.updateQuery(query);
  }

  selectAll = () => {
    const tracks = this.props.tracks.map(track => track.trackName);
    const query = cloneDeep(this.props.query);
    this.setState({
      selectedTracks: new Set(tracks)
    })
    if (query.hasOwnProperty('track')){
      delete query.track
    }
    this.props.updateQuery(query)
  }

  unselectAll = () => {
    const query = cloneDeep(this.props.query);
    this.setState({
      selectedTracks: new Set([])
    })
    query.track = { $in: [] }
    this.props.updateQuery(query)
  }

  render(){
    const {tracks, ...props} = this.props;
    return ( 
      <Dropdown>
        <DropdownButton className='btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0'>
          Tracks&nbsp;
          <span className='badge badge-dark'>
            {`${this.state.selectedTracks.size}/${tracks.length}`}
          </span>
        </DropdownButton>
        <DropdownMenu>
          <h6 className="dropdown-header">Select annotation tracks</h6>
          {
            tracks.map(({ trackName }) => {
              const checked = this.state.selectedTracks.has(trackName);// ? ' active': '';
              return (
                <div key={`${trackName}${checked}`} className='form-check'>
                  <input type='checkbox' className='form-check-input' id={trackName}
                    checked={checked} onChange={this.toggleTrackSelect} />
                  <label className='form-check-label'>{trackName}</label>
                </div>
              )
            })
          }
          <div className="dropdown-divider" />
          <div className="btn-group mx-2" role="group">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-dark" 
              onClick={this.selectAll}>
              Select all
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-dark"
              onClick={this.unselectAll}>
              Unselect all
            </button>
          </div>
        </DropdownMenu>
      </Dropdown>
      
    )
  }
}

export default withConditionalRendering(TrackSelect);

