import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';

import InactiveAccountWarning from './InactiveAccountWarning.jsx';
import Header from './Header.jsx';

class MainLayout extends React.Component {
  constructor(props){
    super(props)
    console.log(this.props)
  }
  render(){

    return (
      <div>
        <Header />
        <main>
          <div className="container-fluid">
          { 
            this.props.content
          }
          </div>
        </main>
      </div>
    )
  }
}

export default MainLayout;