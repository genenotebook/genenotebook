import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { compose } from 'recompose';
import React from 'react';

import { withEither, isLoading, Loading, Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/uiUtil.jsx';
import { Tracks } from '/imports/api/genomes/track_collection.js';

const tracksDataTracker = ({...props}) => {
  const trackSub = Meteor.subscribe('tracks');
  const loading = !trackSub.ready();
  const tracks = Tracks.find().fetch();
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
      show: ''
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

  render(){
    const {tracks, toggleTrackSelect, ...props} = this.props;
    return ( 
      <Dropdown>
        <DropdownButton type='button' className='btn btn-sm btn-outline-dark dropdown-toggle'>
          Tracks&nbsp;
          <span className='badge badge-dark'>
            {`${tracks.length}/${tracks.length}`}
          </span>
        </DropdownButton>
        <DropdownMenu>
          <h6 className="dropdown-header">Select annotation tracks</h6>
          {
            tracks.map(track => {
              const active = ' active';
              return (
                <a key={track.trackName} 
                  className={`dropdown-item ${active}`}
                  id={track.trackName}
                  onClick={toggleTrackSelect.bind(this)} >
                  {track.trackName}
                </a>
              )
            })
          }
          <div className="dropdown-divider" />
          <div className="btn-group mx-2" role="group">
            <button type="button" className="btn btn-sm btn-outline-dark">Select all</button>
            <button type="button" className="btn btn-sm btn-outline-dark">Unselect all</button>
          </div>
        </DropdownMenu>
      </Dropdown>
      
    )
  }
}

export default withConditionalRendering(TrackSelect);
