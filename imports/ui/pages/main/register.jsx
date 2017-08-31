import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

const UsernameInput = (props) => {
  return (
    <div className={`input-group ${ !props.validUsername && 'has-error has-feedback'}`}>
      <span className="input-group-addon">
        <i className="glyphicon glyphicon-user"></i>
      </span>
      <input 
        type="text" 
        className="form-control" 
        placeholder="Username" 
        id="username"  
        pattern="^[a-zA-Z0-9]+$" 
        title="Only letters and numbers"
        onChange = {props.handleChange}
        value = {props.userName}
        required autoFocus />
      { !props.validUsername &&
        <span className="glyphicon glyphicon-remove form-control-feedback"></span>
      }
    </div>
  )
}

const EmailInput = (props) => {
  return (
    <div className={`input-group ${ !props.validEmail && 'has-error'}`}>
      <span className="input-group-addon">
        <i className="glyphicon glyphicon-envelope"></i>
      </span>
      <input 
        type="email" 
        className="form-control" 
        placeholder="Email" 
        id="email" 
        onChange = {props.handleChange}
        value = {props.email}
        required />
      { !props.validEmail &&
        <span className="glyphicon glyphicon-remove form-control-feedback"></span>
      }
    </div>
  )
}

const PassWordInput = (props) => {
  return (
    <div>
      <div className={`input-group password ${ !props.validPassword && 'has-error'}`}>
        <span className="input-group-addon">
          <i className="glyphicon glyphicon-lock"></i>
        </span>
        <input 
          type="password" 
          className="form-control" 
          placeholder="Password" 
          id="password" 
          pattern=".{8,}" 
          title="Minimum 8 charachters"
          onChange = {props.handleChange}
          value = {props.password}
          required />
        { !props.validPassword &&
          <span className="glyphicon glyphicon-remove form-control-feedback"></span>
        }
      </div>
      <div className={`input-group password-repeat ${ !props.validPassword && 'has-error'}`}>
        <span className="input-group-addon">
          <i className="glyphicon glyphicon-lock"></i>
        </span>
        <input 
          type="password" 
          className="form-control" 
          placeholder="Repeat password" 
          id="passwordRepeat"
          onChange = {props.handleChange}
          value = {props.passwordRepeat} 
          required />
        { !props.validPassword &&
          <span className="glyphicon glyphicon-remove form-control-feedback"></span>
        }
      </div>
    </div>
  )
}

class Register extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      validUsername: true,
      email: '',
      validEmail: true,
      password: '',
      passwordRepeat: '',
      validPassword: true
    }
  }

  submit = (event) => {
    event.preventDefault()
    console.log('submit')
    console.log(this.state)
    if (this.state.password !== this.state.passwordRepeat){
      Bert.alert('Passwords do not match!', 'danger', 'growl-top-right')
      this.setState({
        password: '',
        passwordRepeat: '',
        validPassword: false
      })
    } else {
      const userData = {
        username:  this.state.username,
        email: this.state.email,
        password: this.state.password
      }
      Accounts.createUser(userData, (err,res) => {
        if (err){
          this.setState({
            password: '',
            passwordRepeat: ''
          })
          Bert.alert(err.reason,'danger','growl-top-right')
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
          FlowRouter.redirect('/')
        }
      })
    }
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id] : event.target.value
    })
    switch (event.target.id){
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
    return (
      this.state.username.length > 0 &&
      this.state.email.length > 0 &&
      this.state.password.length > 0 &&
      this.state.passwordRepeat.length > 0
    )
  }

  render(){
    return (
      <div className="row">
        <div className="col-sm-8 col-md-offset-2">
        <h1 className="text-center login-title">Create new Genebook account</h1>
          <div className="register">
            <form className="form-register" onSubmit={this.submit} >
              <UsernameInput 
                userName = {this.state.username} 
                validUsername = {this.state.validUsername}
                handleChange = {this.handleChange} />
              <EmailInput 
                email = {this.state.email} 
                validEmail = {this.state.validEmail}
                handleChange = {this.handleChange} />
              <PassWordInput 
                password = {this.state.password} 
                passwordRepeat = {this.state.passwordRepeat} 
                validPassword = {this.state.validPassword}
                handleChange = {this.handleChange} />
              <button 
                className="btn btn-lg btn-success btn-block" 
                type="submit"
                disabled = { !this.filledInAllFields() }>
                {
                  this.filledInAllFields() ? 'Sign up' : 'Please fill in all fields'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

export default createContainer(() => {
  return {}
}, Register)