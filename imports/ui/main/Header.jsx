import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

import SearchBar from './SearchBar.jsx';
import PageloadPopup from './PageloadPopup.jsx';

import './header.scss';

function adminTracker() {
  const userId = Meteor.userId();
  const isAdmin = Roles.userIsInRole(userId, 'admin');
  return {
    isAdmin,
  };
}

function LoggedInButton({ isAdmin }) {
  return (
    <div className="navbar-item has-dropdown is-hoverable">
      <button type="button" className="button is-small navbar-link user-button">
        <span className="icon-user" />
      </button>
      <div className="navbar-dropdown is-right">
        <Link to="/profile" className="navbar-item">
          <span className="icon-pencil" />
            &nbsp;User profile
        </Link>
        <Link to="/#" className="navbar-item" disabled>
          <span className="icon-clipboard" />
            &nbsp;Favourites
        </Link>
        <hr className="navbar-divider" />
        { isAdmin && (
          <>
            <Link to="/admin" className="navbar-item">
              <span className="icon-cog" />
                &nbsp;Admin settings
            </Link>
            <div className="dropdown-divider" />
          </>
        )}
        <button
          type="button"
          className="button is-small is-fullwidth is-danger is-light"
          id="signout"
          onClick={Meteor.logout}
        >
          <span className="icon-logout" />
            &nbsp;Sign out
        </button>
      </div>
    </div>
    /*
    <Dropdown>
      <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle border">
        <span className="icon-user" aria-hidden="true" />
      </DropdownButton>
      <DropdownMenu className="dropdown-menu header-menu px-2">
        <Link to="/profile" className="dropdown-item featuremenu-item">
          <span className="icon-pencil" />
          &nbsp;User profile
        </Link>
        <button
          type="button"
          role="menuitem"
          className="dropdown-item featuremenu-item disabled text-muted"
          disabled
        >
          <span className="icon-clipboard" />
          &nbsp;Favourites
        </button>
        <div className="dropdown-divider" />
        { isAdmin && (
          <>
            <Link to="/admin" className="dropdown-item featuremenu-item">
              <span className="icon-cog" />
              &nbsp;Admin settings
            </Link>
            <div className="dropdown-divider" />
          </>
        )}
        <button
          type="button"
          className="btn btn-outline-danger btn-sm btn-block"
          id="signout"
          onClick={Meteor.logout}
        >
          <span className="icon-logout" />
          &nbsp;Sign out
        </button>
      </DropdownMenu>
    </Dropdown>
        */
  );
}

const LoggedInButtonWithTracker = withTracker(adminTracker)(LoggedInButton);

function LoggedOutButton() {
  return (
    <Link to="/login" className="button user-button" id="signin">
      <span className="icon-login" aria-hidden="true" />
      &nbsp;Sign in
    </Link>
  );
}

const UserButtons = withTracker(() => {
  const isLoggedIn = !!Meteor.userId() && !Meteor.loggingIn();
  return {
    isLoggedIn,
  };
})(({ isLoggedIn }) => (isLoggedIn ? <LoggedInButtonWithTracker /> : <LoggedOutButton />));

function NavBar() {
  const [show, setShow] = useState(false);
  const isActive = show ? 'is-active' : '';
  const urlPrefix = Meteor.absoluteUrl();
  return (
    <nav className="navbar is-light" role="navigation">
      <div className="navbar-brand">
        <NavLink to="/" className="" activeClassName="active">
          <figure className="image is-32x32">
            <img
              id="navbar-brand-image"
              src={`${urlPrefix}logo.svg`}
              alt="GeneNoteBook"
              className="is-rounded"
            />
          </figure>
        </NavLink>
        <button
          className={`navbar-burger burger button ${isActive}`}
          type="button"
          onClick={() => {
            setShow(!show);
          }}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <NavLink id="gene-link" to="/genes" className="navbar-item" activeClassName="active">
          Genes
        </NavLink>
        <NavLink to="/blast" className="navbar-item" activeClassName="active">
          Blast
        </NavLink>
      </div>
      <div className={`navbar-menu ${isActive}`}>
        <div className="navbar-start">
          <SearchBar />
        </div>
        <div className="navbar-end">
          <UserButtons />
        </div>
      </div>
    </nav>
  );
}

export default function Header() {
  const [showPageloadPopup, togglePageloadPopup] = useState(false);
  return (
    <>
      <header role="banner">
        <NavBar />
      </header>
      {showPageloadPopup && (
        <PageloadPopup
          togglePopup={() => {
            togglePageloadPopup(false);
          }}
        />
      )}
    </>
  );
}
