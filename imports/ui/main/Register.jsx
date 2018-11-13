import { Accounts } from 'meteor/accounts-base';
import { withTracker } from 'meteor/react-meteor-data';
//import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';
import { Redirect } from 'react-router-dom';

import './register.scss';

const UsernameInput = ({ userName, validUsername, handleChange }) => {
  return  <div className='input-group username' >
    <div className="input-group-prepend">
      <span className='input-group-text'>
        <span className="icon-user" />
      </span>
    </div>
    <input type="text" className="form-control" placeholder="Username" 
      id="username" pattern="^[a-zA-Z0-9]+$" title="Only letters and numbers"
      onChange={handleChange} value={userName} required autoFocus />
  </div>
}

const EmailInput = ({ email, validEmail, handleChange }) => {
  return <div className='input-group email'>
    <div className="input-group-prepend">
      <span className='input-group-text'>
        <span className="icon-at" />
      </span>
    </div>
    <input type="email" className="form-control" placeholder="Email" 
      id="email" onChange={handleChange} value={email} required />
  </div>
}

const PassWordInput = ({ password, passwordRepeat, validPassword, handleChange }) => {
  return <React.Fragment>
    <div className='input-group password'>
      <div className="input-group-prepend">
        <span className='input-group-text'>
          <span className="icon-lock" />
        </span>
      </div>
      <input type="password" className="form-control" placeholder="Password" 
        id="password" pattern=".{8,}" title="Minimum 8 charachters"
        onChange = {handleChange} value = {password} required />
    </div>
    <div className='input-group password-repeat'>
      <div className="input-group-prepend">
        <span className='input-group-text'>
          <span className="icon-lock" />
        </span>
      </div>
      <input type="password" className="form-control" placeholder="Repeat password" 
        id="passwordRepeat" onChange = {handleChange} value = {passwordRepeat} required />
    </div>
  </React.Fragment>
}

export default class Register extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      validUsername: true,
      email: '',
      validEmail: true,
      password: '',
      passwordRepeat: '',
      validPassword: true,
      redirect: false
    }
  }

  handleSubmit = (event) => {
    event.preventDefault();
    alert('Creating accounts is disabled in this demo')
    /*
    const { username, email, password, passwordRepeat } = this.state;
    if (password !== passwordRepeat){
      alert('Passwords do not match!')
      this.setState({
        password: '',
        passwordRepeat: '',
        validPassword: false
      })
    } else {
      Accounts.createUser({ username, email, password }, (err,res) => {
        if (err){
          this.setState({
            password: '',
            passwordRepeat: ''
          })
          alert(err.reason)
          if (err.reason === 'Username already exists.'){
            this.setState({
              validUsername: false
            })
          } else if (err.reason === 'Email already exists.'){
            this.setState({
              validEmail: false
            })
          }
        } else {
          this.setState({
            redirect: true
          })
          //FlowRouter.redirect('/')
        }
      })
    }
    */
  }

  handleChange = ({ target }) => {
    const { id, value } = target;
    this.setState({
      [id] : value
    })
    switch (id){
      case 'username': {
        this.setState({
          validUsername: true
        })
        break;
      }
      case 'email': {
        this.setState({
          validEmail: true
        })
        break;
      }
      case 'password':
      case 'password-repeat': {
        this.setState({
          validPassword: true
        })
        break
      }
    }
  }

  filledInAllFields = () => {
    const { username, email, password, passwordRepeat } = this.state;
    return username.length && email.length && password.length && passwordRepeat.length;
  }

  render(){
    const { redirect } = this.state;
    if ( redirect ) {
      return <Redirect to='/' />
    }

    const filledInAllFields = this.filledInAllFields();
    const btnClass = filledInAllFields ? 'btn-success' : 'btn-outline-success';
    
    return <div className='card register'>
      <form className="form-register text-center" onSubmit={this.handleSubmit}>
        <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="100" height="100" />
        <h1 className="h3 mb-3 font-weight-normal">Create GeneNoteBook Account</h1>
        <UsernameInput {...this.state} handleChange={this.handleChange} />
        <EmailInput {...this.state} handleChange={this.handleChange} />
        <PassWordInput {...this.state} handleChange={this.handleChange} />
        <button className={`btn btn-lg btn-block ${ btnClass }`} 
          type="submit" disabled={ !filledInAllFields }>
          {
            filledInAllFields ? 'Sign up' : 'Please fill in all fields'
          }
        </button>
      </form>
    </div>
  }
}