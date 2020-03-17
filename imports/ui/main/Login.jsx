/* eslint-disable jsx-a11y/label-has-associated-control */
import { Meteor } from 'meteor/meteor';
// import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import { Redirect, Link } from 'react-router-dom';

import './login.scss';

export default function Login({ location }) {
  const redirectTo = location.from ? location.from : '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    Meteor.loginWithPassword(username, password, (err) => {
      setPassword('');
      if (err) {
        alert(err.reason);
      } else {
        setRedirect(true);
      }
    });
  }

  if (redirect) {
    return <Redirect to={redirectTo} />;
  }
  return (
    <div className="hero is-small is-light is-bold">
      <div className="hero-body">
        <div className="container columns is-centered has-text-centered">
          <form className="card column is-4 login-form" onSubmit={handleSubmit}>
            <div className="card-image">
              <figure className="image is-96x96">
                <img className="is-rounded" src="logo.svg" alt="" />
              </figure>
            </div>
            <div className="card-content">
              <div className="content">
                <div className="field">
                  <label className="label is-sr-only">Username</label>
                  <div className="control has-icons-left">
                    <input
                      type="text"
                      id="username"
                      className="input is-small"
                      placeholder="Username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      autoComplete="username"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-user" />
                    </span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="password" className="label is-sr-only">Password</label>
                  <div className="control has-icons-left">
                    <input
                      type="password"
                      id="password"
                      className="input is-small"
                      placeholder="Password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-lock" />
                    </span>
                  </div>
                </div>
                <div className="control">
                  <button
                    className="button is-link is-light is-fullwidth is-large"
                    type="submit"
                  >
                    Sign in
                  </button>
                </div>

                <footer className="card-footer">
                  <Link to="/register" id="new-account">
                    Create new account
                  </Link>
                </footer>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
