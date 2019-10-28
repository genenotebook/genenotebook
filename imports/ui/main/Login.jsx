import { Meteor } from 'meteor/meteor';
// import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import { Redirect, Link } from 'react-router-dom';

import './login.scss';

export default function Login({ location }){
  const redirectTo = location.from ? location.from : '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    Meteor.loginWithPassword(username, password, (err,res) => {
      setPassword('');
      if (err) {
        alert(err.reason)
      } else {
        setRedirect(true)
      }
    })
  }

  if (redirect) {
    return <Redirect to={redirectTo} />
  }
  return (
    <div className="card signin">
      <form className="form-signin text-center" onSubmit={handleSubmit}>
        <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="100" height="100" />
        <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
        <label htmlFor="inputEmail" className="sr-only">Username</label>
        <input 
          type="text" 
          id="username" 
          className="form-control" 
          placeholder="Username" 
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required autoFocus />
        <label htmlFor="inputPassword" className="sr-only">Password</label>
        <input 
          type="password" 
          id="password" 
          className="form-control" 
          placeholder="Password" 
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required />
        <button 
          className="btn btn-lg btn-primary btn-block mb-3" type="submit">Sign in</button>
        <Link to='/register' id='new-account'>
          Create new account
        </Link>
        <p className="mt-5 mb-3 text-muted">© 2017-2018</p>
      </form>
    </div>
  )
}

