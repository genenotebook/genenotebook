import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { NavLink } from 'react-router-dom';

import AdminUsers from './users/AdminUsers.jsx';
import AdminGenomes from './genomes/AdminGenomes.jsx';
import AdminAttributes from './attributes/AdminAttributes.jsx';
import AdminTranscriptomes from './transcriptomes/AdminTranscriptomes.jsx';
import AdminJobqueue from './jobqueue/AdminJobqueue.jsx';
//import AdminUserGroups from './user-groups/AdminUserGroups.jsx';

const ADMIN_PAGES = {
  'users': <AdminUsers />,
  //'user-groups': <AdminUserGroups />,
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

const Nav = ({ pages, changePage }) => {
  return (
    <div className="card-header">
      <h2 className="text-dark">Admin panel</h2>
      <ul className="nav nav-tabs card-header-tabs">
        {
          pages.map(page => {
            const pageName = urlToName(page);
            return (
              <li key={ page } role="presentation" className="nav-item">
                <NavLink to={`/admin/${page}`} className='nav-link' activeClassName='active'
                  id={page} onClick={changePage}>
                  { pageName }
                </NavLink>
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
    const { currentPage } = this.state;
    const pages = Object.keys(ADMIN_PAGES);
    return (
      <div className="container-fluid px-0 mx-0">
        <div className="card admin-panel my-2">
          <Nav pages={pages} changePage={this.changePage} />
          {
            ADMIN_PAGES[currentPage]
          }
        </div>
      </div>
      
    )
  }
}

export default withTracker(({ match }) => {
  const currentPage = match.params.page;
  return {
    currentPage
  }
})(Admin)