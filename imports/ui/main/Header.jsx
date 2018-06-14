import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import './header.scss';

class LoggedInNavbar extends React.Component {
  constructor(props){
    super(props)
  }

  signOut = event => {
    Meteor.logout();
  }

  render(){
    return (
      <div className="collapse navbar-collapse justify-content-between" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
            <a className="nav-link" href="/genes" id="genes">Genes</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/blast" id="blast">Blast</a>
          </li>
        </ul>
        <form className="form-inline my-0 my-lg-0 search" role="search">
          <div className="input-group input-group-sm mb-0">
            <input type="text" className="form-control" />
            <div className="input-group-append btn-group">
              <button type="button" className="btn btn-sm btn-outline-success">Search</button>
              <Dropdown>
                <DropdownButton className='btn btn-sm btn-outline-success dropdown-toggle dropdown-toggle-split' />
                <DropdownMenu className='dropdown-menu dropdown-menu-left'>
                  <a className="dropdown-item disabled" disabled>Genes</a>
                  <a className="dropdown-item disabled" disabled>Genomes</a>
                  <a className="dropdown-item disabled" disabled>Transcriptomes</a>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </form>
        <ul className="nav navbar-nav navbar-right">
          {this.props.isAdmin &&
            <li>
              <a className="nav-link" href="/admin"><span className="fa fa-cog" aria-hidden="true"></span> Admin settings</a>
            </li>
          }
          <li className="mb-0 my-1">
            <Dropdown>
              <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle">
                <span className="fa fa-user" aria-hidden="true" />{/* Meteor.userId() */}
              </DropdownButton>
              <DropdownMenu className='dropdown-menu header-menu px-2'>
                <a role="menuitem" href="/profile" className="dropdown-item featuremenu-item">Edit profile</a>
                <a role="menuitem" className="dropdown-item featuremenu-item disabled" disabled>My favourites</a>
                <div className="dropdown-divider" />
                <button type="button" className="btn btn-outline-danger btn-sm btn-block" id="signout" onClick={this.signOut}>
                  Sign out
                </button>
              </DropdownMenu>
            </Dropdown>
          </li>
        </ul>
      </div>
    )
  }
}

const LoggedOutNavbar = props => {
  return (
    <div className="collapse navbar-collapse d-flex justify-content-between" id="navbarSupportedContent">
      <ul className="navbar-nav mr-auto">
        <a href="/login" className="btn btn-primary btn-large navbar-btn pull-right" id="signin">
          <i className="fa fa-sign-in" aria-hidden="true"></i> Sign in
        </a>
      </ul>
    </div>
  )
}

class Header extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <header className="navigation border" role="banner">
        <nav className="navbar navbar-expand bg-light navbar-light justify-content-between py-0">
          <button className="navbar-toggler navbar-toggler-right" 
            type="button" data-toggle="collapse" data-target="#navbarSupportedContent" 
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <a className="navbar-brand" href="/">
            <img src="logo.svg" alt="GeneNoteBook logo" className="navbar-logo rounded-circle" />
          </a>
          {  
            this.props.loggedIn ?
            <LoggedInNavbar isAdmin={this.props.isAdmin}/> :
            <LoggedOutNavbar />
          }
        </nav>
      </header>
    )
  }
}

export default withTracker(props => {
  const userId = Meteor.userId();
  const isAdmin = Roles.userIsInRole(userId, 'admin');
  return {
    loading: false,
    loggedIn: !!userId,
    isAdmin: isAdmin
  }
})(Header)