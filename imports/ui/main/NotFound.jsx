import React from 'react';

import './notFound.scss';

function NotFound() {
  return (
    <div className="container">
      <div className="card border mb-3 not-found text-center">
        <div className="card-header">
          <h2 className="text-primary">404 PAGE NOT FOUND</h2>
        </div>
        <div className="card-body">
          <h6 className="card-title">The page you are looking for can not be found</h6>
          <p className="card-text">Try something else, or contact the site maintainer</p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
