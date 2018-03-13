import React from 'react';

import './notFound.scss';

const NotFound = props => {
  return (
    <div className="container">
      <div className="card border-info mb-3 not-found text-center">
        <div className="card-header">
          <h2 className="text-info">404 PAGE NOT FOUND</h2>
        </div>
        <div className="card-body text-info">
          <h6 className="card-title">
            The page you are looking for can not be found
          </h6>
          <p className="card-text">
            Please try something else, or contact an admin user
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound