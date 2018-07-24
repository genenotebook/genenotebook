import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import SearchBar from './SearchBar.jsx';

import './header.scss';

const adminTracker = () => {
  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  return {
    isAdmin
  }
}

const LoggedInButton = ({ isAdmin }) => {
  return <Dropdown>
    <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle">
      <span className="icon-user" aria-hidden="true" />
    </DropdownButton>
    <DropdownMenu className='dropdown-menu header-menu px-2'>
      <a role="menuitem" href={`${Meteor.absoluteUrl()}profile`} className="dropdown-item featuremenu-item">
        <span className='icon-pencil' /> Edit profile
      </a>
      <a role="menuitem" className="dropdown-item featuremenu-item disabled text-muted" disabled>
        <span className='icon-clipboard' /> My favourites
      </a>
      <div className="dropdown-divider" />
      {
        isAdmin &&
        <React.Fragment>
          <a role="menuitem" href={`${Meteor.absoluteUrl()}admin`} className="dropdown-item featuremenu-item">
            <span className="icon-cog" /> Admin settings
          </a>
          <div className="dropdown-divider" />
        </React.Fragment>
      }
      
      <button type="button" className="btn btn-outline-danger btn-sm btn-block" id="signout" onClick={Meteor.logout}>
        <span className='icon-logout' /> Sign out
      </button>
    </DropdownMenu>
  </Dropdown>
}

const LoggedInButtonWithTracker = withTracker(adminTracker)(LoggedInButton);

const LoggedOutButton = () => {
  return <a href="/login" className="btn btn-primary btn-sm" id="signin">
    <span className="icon-login" aria-hidden="true" /> Sign in
  </a>
}

const UserButtons = () => {
  const loggedIn = !!Meteor.userId();
  return loggedIn ? 
  <LoggedInButtonWithTracker /> :
  <LoggedOutButton />
}

const routeTracker = ({ routes }) => {
  FlowRouter.watchPathChange();
  const currentContext = FlowRouter.current();
  const activeRoute = routes.filter(route => {
    return new RegExp(route).test(currentContext.path);
  })[0];
  return {
    routes,
    activeRoute
  }
}

const Nav = ({ routes, activeRoute }) => {
  return <ul className='navbar-nav'>
    {
      routes.map(route => {
        const active = route === activeRoute ? 'active' : '';
        return <li key={route} className={`nav-item ${active}`}>
          <a className='nav-link' href={`${Meteor.absoluteUrl()}${route}`}>
            { route.replace(/\w/, c => c.toUpperCase()) }
          </a>
        </li>
      })
    }
  </ul>
}

const NavWithRouteTracker = withTracker(routeTracker)(Nav);

class NavBar extends React.PureComponent {
  constructor(props){
    super(props)
    this.state = {
      show: false
    }
  }

  toggleShow = () => {
    this.setState({
      show: !this.state.show
    })
  }

  render(){
    const show = this.state.show ? 'show' : '';
    return <nav className='navbar navbar-expand-md bg-light navbar-light py-0'>
      <div className='container'>
        <a className="navbar-brand" href="/">
          <img src="logo.svg" alt="GeneNoteBook logo" className="navbar-logo rounded-circle" />
        </a>
        <button className='navbar-toggler' type='button' onClick={this.toggleShow}>
          <span className='navbar-toggler-icon' />
        </button>
        <div className={`collapse navbar-collapse justify-content-between ${show}`} id='navbar'>
          <NavWithRouteTracker routes={['genes','blast']} />
          <SearchBar />
          <UserButtons />
        </div>
      </div>
    </nav>
  }
}

const Header = () => {
  return <header className='navigation border' role='banner'>
    <NavBar />
  </header>
};

export default Header;