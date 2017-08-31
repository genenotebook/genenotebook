import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

const UsernameInput = (props) => {
  return (
    <div className='input-group'>
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
    </div>
  )
}

const EmailInput = (props) => {
  return (
    <div className="input-group">
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
    </div>
  )
}

const PassWordInput = (props) => {
  return (
    <div>
      <div className="input-group password">
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
      </div>
      <div className="input-group password-repeat">
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
      </div>
    </div>
  )
}

class Register extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      email: '',
      password: '',
      passwordRepeat: ''
    }
  }

  submit = (event) => {
    event.preventDefault()
    console.log('submit')
    console.log(this.state)
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id] : event.target.value
    })
  }

  render(){
    return (
      <div className="row">
        <div className="col-sm-8 col-md-offset-2">
        <h1 className="text-center login-title">Create new Genebook account</h1>
          <div className="register">
            <form className="form-register" onSubmit={this.submit} >
              <UsernameInput userName = {this.state.username} handleChange = {this.handleChange} />
              <EmailInput email = {this.state.email} handleChange = {this.handleChange} />
              <PassWordInput password = {this.state.password} passwordRepeat = {this.state.passwordRepeat} handleChange = {this.handleChange} />
              <button className="btn btn-lg btn-success btn-block" type="submit">
                Sign up
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