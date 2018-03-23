import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';

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
            <div className="input-group-append">
              <button type="button" className="btn btn-outline-success">Search</button>
              <button type="button" className="btn btn-outline-success dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span className="sr-only">Toggle Dropdown</span>
              </button>
              <div className="dropdown-menu">
                <a className="dropdown-item" href="#">Action</a>
                <a className="dropdown-item" href="#">Another action</a>
                <a className="dropdown-item" href="#">Something else here</a>
                <div role="separator" className="dropdown-divider"></div>
                <a className="dropdown-item" href="#">Separated link</a>
              </div>
            </div>
          </div>
          {/*
          <input type="text" name="search" className="form-control mr-sm-2" placeholder="Search" value="" />
          <button type="submit" className="btn btn-outline-success my-2 my-sm-0">Search</button>
          
            <button className="btn btn-danger" id="clear-search">
              <span className="glyphicon glyphicon-remove-circle"></span>
            </button>
          */}
        </form>
        <ul className="nav navbar-nav navbar-right">
          {this.props.isAdmin &&
            <li>
              <a className="nav-link" href="/admin"><span className="fa fa-cog" aria-hidden="true"></span> Admin settings</a>
            </li>
          }
          <li className="mb-0 my-1">
            <div className="btn-group dropdown">
              <button type="button" className="btn btn-sm btn-secondary btn-outline-dark dropdown-toggle " 
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span className="fa fa-user-o" aria-hidden="true"></span> username {/*{ currentUser.username }*/}
              </button>
              <div className="dropdown-menu dropdown-menu-right">
                <a role="menuitem" href="/profile" className="dropdown-item featuremenu-item">Edit profile</a>
                <a role="menuitem" className="dropdown-item featuremenu-item">My favourites</a>
                <div className="dropdown-divider" />
                <button type="button" className="btn btn-outline-danger btn-sm btn-block" id="signout" onClick={this.signOut}>
                  Sign out
                </button>
              </div>
            </div>
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
      <header className="navigation" role="banner">
        <nav className="navbar navbar-expand bg-light navbar-light justify-content-between">
          <button className="navbar-toggler navbar-toggler-right" 
            type="button" data-toggle="collapse" data-target="#navbarSupportedContent" 
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <a className="navbar-brand" href="/">{/*{prefix}*/} Genebook</a>
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