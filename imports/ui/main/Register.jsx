/* eslint-disable jsx-a11y/label-has-associated-control */
import { Accounts } from 'meteor/accounts-base';

import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';

import './register.scss';

export default function Register({ location }) {
  const redirectTo = location.from ? location.from : '/';

  const [redirect, setRedirect] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  const filledInAllFields = username.length
    && email.length
    && password.length
    && passwordRepeat.length;
  const btnClass = filledInAllFields ? 'is-success' : 'is-success is-outlined';

  function handleSubmit(event) {
    event.preventDefault();
    if (password !== passwordRepeat) {
      alert('Passwords do not match!');
      setPassword('');
      setPasswordRepeat('');
    } else {
      Accounts.createUser({ username, email, password }, (err) => {
        if (err) {
          setPassword('');
          setPasswordRepeat('');
          alert(err.reason);
        } else {
          setRedirect(true);
        }
      });
    }
  }

  if (redirect) {
    return <Redirect to={redirectTo} />;
  }

  return (
    <div className="hero is-small is-light is-bold register-user">
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
                <h3 className="is-3">Create GeneNoteBook Account</h3>

                <div className="field username">
                  <label className="label is-sr-only">Username</label>
                  <div className="control has-icons-left">
                    <input
                      type="text"
                      className="input is-small"
                      placeholder="Username"
                      id="username"
                      pattern="^[a-zA-Z0-9]+$"
                      title="Only letters and numbers"
                      onChange={(event) => setUsername(event.target.value)}
                      value={username}
                      required
                      autoComplete="username"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-user" />
                    </span>
                  </div>
                </div>

                <div className="field email">
                  <label className="label is-sr-only">E-mail</label>
                  <div className="control has-icons-left">
                    <input
                      type="email"
                      className="input is-small"
                      placeholder="Email"
                      id="email"
                      onChange={(event) => setEmail(event.target.value)}
                      value={email}
                      required
                      autoComplete="email"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-at" />
                    </span>
                  </div>
                </div>

                <div className="field password">
                  <label className="label is-sr-only">Password</label>
                  <div className="control has-icons-left">
                    <input
                      type="password"
                      className="input is-small"
                      placeholder="Password"
                      id="password"
                      pattern=".{8,}"
                      title="Minimum 8 charachters"
                      onChange={(event) => setPassword(event.target.value)}
                      value={password}
                      required
                      autoComplete="new-password"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-lock" />
                    </span>
                  </div>
                </div>

                <div className="field password-repeat">
                  <label className="label is-sr-only">Repeat password</label>
                  <div className="control has-icons-left">
                    <input
                      type="password"
                      className="input is-small"
                      placeholder="Repeat password"
                      id="passwordRepeat"
                      onChange={(event) => setPasswordRepeat(event.target.value)}
                      value={passwordRepeat}
                      required
                      autoComplete="new-password"
                    />
                    <span className="icon is-small is-left">
                      <span className="icon-lock" />
                    </span>
                  </div>
                </div>

                <button
                  className={`button is-large is-fullwidth ${btnClass}`}
                  type="submit"
                  disabled={!filledInAllFields}
                >
                  {
            filledInAllFields ? 'Sign up' : 'Please fill in all fields'
          }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
