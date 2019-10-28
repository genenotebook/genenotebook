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
  const btnClass = filledInAllFields ? 'btn-success' : 'btn-outline-success';

  function handleSubmit(event) {
    event.preventDefault();
    if (password !== passwordRepeat){
      alert('Passwords do not match!')
      setPassword('');
      setPasswordRepeat('');
    } else {
      Accounts.createUser({ username, email, password }, (err,res) => {
        if (err){
          setPassword('');
          setPasswordRepeat('');
          alert(err.reason)
        } else {
          setRedirect(true);
        }
      })
    }
  }
  
  if ( redirect ) {
    return <Redirect to={redirectTo} />
  }

  return (
    <div className='card register'>
      <form className="form-register text-center" onSubmit={handleSubmit}>
        <img 
          className="mb-4 rounded-circle" 
          src="logo.svg" 
          alt="" 
          width="100" 
          height="100" />
        <h1 className="h3 mb-3 font-weight-normal">
          Create GeneNoteBook Account
        </h1>

        <div className='input-group username' >
          <div className="input-group-prepend">
            <span className='input-group-text'>
              <span className="icon-user" />
            </span>
          </div>
          <input
            type="text"
            className="form-control" 
            placeholder="Username"
            id="username"
            pattern="^[a-zA-Z0-9]+$"
            title="Only letters and numbers"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
            required autoFocus />
        </div>

        <div className='input-group email'>
          <div className="input-group-prepend">
            <span className='input-group-text'>
              <span className="icon-at" />
            </span>
          </div>
          <input 
            type="email" 
            className="form-control" 
            placeholder="Email" 
            id="email" 
            onChange={(event) => setEmail(event.target.value)} 
            value={email} 
            required />
        </div>

        <div className='input-group password'>
          <div className="input-group-prepend">
            <span className='input-group-text'>
              <span className="icon-lock" />
            </span>
          </div>
          <input
            type="password"
            className="form-control"
            placeholder="Password" 
            id="password"
            pattern=".{8,}"
            title="Minimum 8 charachters"
            onChange={(event) => setPassword(event.target.value)}
            value={password}
            required />
        </div>
        <div className='input-group password-repeat'>
          <div className="input-group-prepend">
            <span className='input-group-text'>
              <span className="icon-lock" />
            </span>
          </div>
          <input
            type="password"
            className="form-control"
            placeholder="Repeat password" 
            id="passwordRepeat"
            onChange={(event) => setPasswordRepeat(event.target.value)}
            value={passwordRepeat}
            required />
        </div>

        <button className={`btn btn-lg btn-block ${ btnClass }`} 
          type="submit" disabled={ !filledInAllFields }>
          {
            filledInAllFields ? 'Sign up' : 'Please fill in all fields'
          }
        </button>
      </form>
    </div>
  )
}
