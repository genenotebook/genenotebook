import React from 'react';

import './inactiveAccountWarning.scss';

const InactiveAccountWarning = props => {
  return (
    <div className='container alert alert-danger text-center inactive-account-warning' role='alert'>
      <h4 className='alert-heading'>
        <span className="icon-exclamation"/> Inactive account
      </h4>
      <p>
        Your account is currently not activated <br/>
        This means you can not use all features
      </p>
      <hr/>
      <p className="mb-0">
        <strong>Please have your account activated by an admin user</strong>
      </p>
    </div>
  )
}

export default InactiveAccountWarning;