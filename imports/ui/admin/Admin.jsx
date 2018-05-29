import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

import AdminUsers from './AdminUsers.jsx';
import AdminGenomes from './genomes/AdminGenomes.jsx';
import AdminTracks from './tracks/AdminTracks.jsx';
import AdminAttributes from './AdminAttributes.jsx';
import AdminTranscriptomes from './transcriptomes/AdminTranscriptomes.jsx';
import AdminJobqueue from './AdminJobqueue';

const ADMIN_PAGES = {
  users: <AdminUsers />,
  genomes: <AdminGenomes />,
  tracks: <AdminTracks />,
  attributes: <AdminAttributes />,
  transcriptomes: <AdminTranscriptomes />,
  jobqueue: <AdminJobqueue />
}

const Nav = (props) => {
  return (
    <div className="card-header">
      <a className="navbar-brand" href="#">Admin panel</a>
      <ul className="nav nav-tabs card-header-tabs">
        {
          props.pages.map(page => {
            const url = page.toLowerCase().replace(' ','_')
            const active = url === props.currentPage ? 'active' : '';
            return (
              <li key={ page } role="presentation" className="nav-item">
                <a href={ `/admin/${url}` } className={`nav-link ${active}`} name={ url } onClick={props.changePage}> 
                  { page } 
                </a>
              </li>
            )
          })
        }
      </ul>
    </div>
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
      <div className="">
        <div className="card admin-panel">
          <Nav pages = { pages } currentPage = {this.state.currentPage} changePage = {this.changePage} />
          {
            ADMIN_PAGES[this.state.currentPage]
          }
        </div>
      </div>
      
    )
  }
}

export default withTracker(props => {
  const page = FlowRouter.getParam('_id')
  return {
    currentPage: page
  }
})(Admin)