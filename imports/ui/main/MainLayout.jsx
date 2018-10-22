import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';

import InactiveAccountWarning from './InactiveAccountWarning.jsx';
import Header from './Header.jsx';
import PageloadPopup from './PageloadPopup.jsx';

class MainLayout extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showPageloadPopup: !Meteor.userId()
    }
  }

  togglePageloadPopup = () => {
    this.setState({
      showPageloadPopup: false
    })
  }

  render(){
    const { showPageloadPopup } = this.state;

    return <div>
      {
        showPageloadPopup &&
        <PageloadPopup togglePopup={this.togglePageloadPopup} />
      }
      <Header />
      <main>
        <div className="container-fluid">
        { 
          this.props.content
        }
        </div>
      </main>
    </div>
  }
}

export default MainLayout;