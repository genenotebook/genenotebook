import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Redirect, Link } from 'react-router-dom';

import './login.scss';

class Login extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      username: '',
      password: '',
      redirect: false
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
        this.setState({
          redirect: true
        })
      }
    })
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value
    })
  }

  render(){
    const { redirect } = this.state;
    const { redirectTo } = this.props;
    
    if (redirect) {
      return <Redirect to={redirectTo} />
    }

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
          <Link to='/register' id='new-account'>
            Create new account
          </Link>
          <p className="mt-5 mb-3 text-muted">© 2017-2018</p>
        </form>
      </div>
    )
  }
}

export default withTracker(props => {
  return {
    redirectTo: '/'
  }
})(Login);
