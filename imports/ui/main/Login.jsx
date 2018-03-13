import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

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
    Meteor.loginWithPassword(this.state.username, this.state.password, (err,res) => {
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
      <div>
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
      </div>
    )
  }
}

export default withTracker(props => {
  return {
    redirect: '/'
  }
})(Login);