import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

import AdminUsers from './users/AdminUsers.jsx';
import AdminGenomes from './genomes/AdminGenomes.jsx';
import AdminAttributes from './attributes/AdminAttributes.jsx';
import AdminTranscriptomes from './transcriptomes/AdminTranscriptomes.jsx';
import AdminJobqueue from './jobqueue/AdminJobqueue.jsx';
import AdminUserGroups from './user-groups/AdminUserGroups.jsx';

const ADMIN_PAGES = {
  'users': <AdminUsers />,
  'user-groups': <AdminUserGroups />,
  'genomes': <AdminGenomes />,
  'attributes': <AdminAttributes />,
  'transcriptomes': <AdminTranscriptomes />,
  'jobqueue': <AdminJobqueue />
}

const urlToName = url => {
  return url
    .match(/(\w)(\w*)/g)
    .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

const Nav = ({ pages, currentPage, changePage }) => {
  return (
    <div className="card-header">
      <h2 className="text-dark">Admin panel</h2>
      <ul className="nav nav-tabs card-header-tabs">
        {
          pages.map(page => {
            const pageName = urlToName(page);
            const active = page === currentPage ? 'active' : '';
            return (
              <li key={ page } role="presentation" className="nav-item">
                <a href={ `/admin/${page}` } className={`nav-link ${active}`} id={ page } onClick={changePage}> 
                  { pageName } 
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
    const { currentPage } = props;
    this.state = { currentPage };
  }

  changePage = (event) => {
    const currentPage = event.target.id;
    this.setState({ currentPage });
  }

  render(){
    const pages = ['Users','User Groups','Genomes','Annotation tracks','Transcriptomes','Attributes','Jobqueue']
    return (
      <div className="">
        <div className="card admin-panel">
          <Nav pages = { Object.keys(ADMIN_PAGES) } currentPage = {this.state.currentPage} changePage = {this.changePage} />
          {
            ADMIN_PAGES[this.state.currentPage]
          }
        </div>
      </div>
      
    )
  }
}

export default withTracker(props => {
  const currentPage = FlowRouter.getParam('_id');
  return {
    currentPage
  }
})(Admin)