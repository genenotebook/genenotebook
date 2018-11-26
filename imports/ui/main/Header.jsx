import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';
import { NavLink, Link } from 'react-router-dom';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import SearchBar from './SearchBar.jsx';
import PageloadPopup from './PageloadPopup.jsx';

import './header.scss';

const adminTracker = () => {
  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  return {
    isAdmin
  }
}

const logout = () => {
  Meteor.logout();
}

const LoggedInButton = ({ isAdmin }) => {
  return <Dropdown>
    <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle border">
      <span className="icon-user" aria-hidden="true" />
    </DropdownButton>
    <DropdownMenu className='dropdown-menu header-menu px-2'>
      <Link to='/profile' className="dropdown-item featuremenu-item">
        <span className='icon-pencil' /> User profile
      </Link>
      <a role="menuitem" className="dropdown-item featuremenu-item disabled text-muted" disabled>
        <span className='icon-clipboard' /> Favourites
      </a>
      <div className="dropdown-divider" />
      {
        isAdmin &&
        <React.Fragment>
          <Link to='/admin' className="dropdown-item featuremenu-item">
            <span className="icon-cog" /> Admin settings
          </Link>
          <div className="dropdown-divider" />
        </React.Fragment>
      }
      
      <button type="button" className="btn btn-outline-danger btn-sm btn-block" id="signout" onClick={logout}>
        <span className='icon-logout' /> Sign out
      </button>
    </DropdownMenu>
  </Dropdown>
}

const LoggedInButtonWithTracker = withTracker(adminTracker)(LoggedInButton);

const LoggedOutButton = () => {
  return <Link to='/login' className="btn btn-primary btn-sm" id="signin">
    <span className="icon-login" aria-hidden="true" /> Sign in
  </Link>
}

const UserButtons = withTracker(() => {
  const isLoggedIn = !!Meteor.userId() && !Meteor.loggingIn();
  return {
    isLoggedIn
  }
})(({ isLoggedIn }) => {
  return isLoggedIn ? 
  <LoggedInButtonWithTracker /> :
  <LoggedOutButton />
})


class NavBar extends React.Component {
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
        <NavLink to='/' className='navbar-brand' activeClassName='active'>
          <small>
            <img src="logo.svg" alt="GeneNoteBook logo" className="navbar-logo rounded-circle" />
          </small>
        </NavLink>
        <button className='navbar-toggler' type='button' onClick={this.toggleShow}>
          <span className='navbar-toggler-icon' />
        </button>
        <div className={`collapse navbar-collapse justify-content-between ${show}`} id='navbar'>
          <ul className='navbar-nav'>
            <li className='nav-item'>
              <NavLink to='/genes' className='nav-link' activeClassName='active'>
                Genes
              </NavLink>
            </li>
            <li className='nav-item'>
              <NavLink to='/blast' className='nav-link' activeClassName='active'>
                Blast
              </NavLink>
            </li>
          </ul>
          <SearchBar />
          <UserButtons />
        </div>
      </div>
    </nav>
  }
}

/*
const Header = () => {
  return <header className='navigation border' role='banner'>
    <NavBar />
  </header>
};
*/

class Header extends React.Component {
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
    return <React.Fragment>
      <header className='navigation border' role='banner'>
        <NavBar />
      </header>
      {
        showPageloadPopup &&
        <PageloadPopup togglePopup={this.togglePageloadPopup} />
      }
    </React.Fragment>
  }
}

export default Header;