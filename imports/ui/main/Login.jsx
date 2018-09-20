import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

import './login.scss';

class Login extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      password: ''
    }
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { username, password } = this.state;
    Meteor.loginWithPassword(username, password, (err,res) => {
      this.setState({
        password: ''
      })
      if (err) {
        alert(err.reason)
      } else {
        FlowRouter.redirect(this.props.redirect)
      }
    })
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value
    })
  }

  render(){
    return (
      <div className="card signin">
        <form className="form-signin text-center" onSubmit={this.handleSubmit}>
          <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="100" height="100" />
          <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
          <label htmlFor="inputEmail" className="sr-only">Username</label>
          <input 
            type="text" 
            id="username" 
            className="form-control" 
            placeholder="Username" 
            onChange={this.handleChange}
            required autoFocus />
          <label htmlFor="inputPassword" className="sr-only">Password</label>
          <input 
            type="password" 
            id="password" 
            className="form-control" 
            placeholder="Password" 
            onChange={this.handleChange}
            required />
          <button 
            className="btn btn-lg btn-primary btn-block mb-3" type="submit">Sign in</button>
          <a href={`${Meteor.absoluteUrl()}register`} id="new-account">Create new account</a>
          <p className="mt-5 mb-3 text-muted">© 2017-2018</p>
        </form>
      </div>
    )
  }
}

export default withTracker(props => {
  return {
    redirect: '/'
  }
})(Login);

        {/*
        <div className="row justify-content-center">
          <div className="col-3">
            <h1 className="text-center login-title">Sign in to continue</h1>
            <div className="login">
              <form className="form-signin" onSubmit={this.handleSubmit}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Username" 
                  id="username"
                  onChange = {this.handleChange}
                  value = {this.state.username} 
                  required autoFocus />
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Password" 
                  id="password"
                  onChange = {this.handleChange} 
                  value = {this.state.password}
                  required />
                <button className="btn btn-lg btn-primary btn-block" type="submit">
                  Sign in
                </button>
              </form>
            </div>
            <a href="/register" className="text-center new-account" id="new-account">Create new account</a>
          </div>
        </div>
      */}