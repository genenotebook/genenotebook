import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

import AdminUsers from './AdminUsers.jsx';
import AdminGenomes from './AdminGenomes.jsx';
import AdminTracks from './AdminTracks.jsx';
import AdminAttributes from './AdminAttributes.jsx';
import AdminTranscriptomes from './AdminTranscriptomes.jsx';

const ADMIN_PAGES = {
  users: <AdminUsers />,
  genomes: <AdminGenomes />,
  tracks: <AdminTracks />,
  attributes: <AdminAttributes />,
  transcriptomes: <AdminTranscriptomes />
}

const Nav = (props) => {
  return (
    <ul className="nav nav-tabs">
      {
        props.pages.map(page => {
          const url = page.toLowerCase().replace(' ','_')
          return (
            <li key={ page } role="presentation" className={ url === props.currentPage && 'active' }>
              <a href={ `/admin/${url}` } name={ url } onClick={props.changePage}> 
                { page } 
              </a>
            </li>
          )
        })
      }
    </ul>
  )
}

class Admin extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      currentPage: props.currentPage
    }
  }

  changePage = (event) => {
    this.setState({
      currentPage: event.target.name
    })
  }

  render(){
    console.log(this.state)
    const pages = ['Users','User Groups','Genomes','Tracks','Transcriptomes','Attributes','Jobqueue']
    return (
      <div className="container">
        <h3> Admin panel</h3>
        <hr/>
        <Nav pages = { pages } currentPage = {this.state.currentPage} changePage = {this.changePage} />
        {ADMIN_PAGES[this.state.currentPage]}
      </div>
      
    )
  }
}

export default createContainer(() => {
  const page = FlowRouter.getParam('_id')
  return {
    currentPage: page
  }
},Admin)