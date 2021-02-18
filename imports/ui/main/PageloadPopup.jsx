/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */

import React from 'react';
import PropTypes from 'prop-types';

function PageloadPopup({ togglePopup }) {
  return (
    <>
      <div className="backdrop" />
      <div className="modal" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Welcome to GeneNoteBook</h5>
              <button type="button" className="close" aria-label="Close" onClick={togglePopup}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              This is an example GeneNoteBook instance with publicly available data to demonstrate
              GeneNoteBook functionality.
              <hr />
              For convenience, a guest user account is available:
              <form>
                <div className="form-group row mb-0 mt-1 mx-auto">
                  <label htmlFor="username" className="col-sm-2 col-form-label">
                    Username:
                  </label>
                  <div className="col-sm-10">
                    <input
                      type="text"
                      readOnly
                      className="form-control-plaintext"
                      id="username"
                      value="guest"
                    />
                  </div>
                </div>
                <div className="form-group row mx-auto">
                  <label htmlFor="password" className="col-sm-2 col-form-label">
                    Password:
                  </label>
                  <div className="col-sm-10">
                    <input
                      type="text"
                      readOnly
                      className="form-control-plaintext"
                      id="password"
                      value="guestguest"
                    />
                  </div>
                </div>
              </form>
              <hr />
              Unlike regular GeneNoteBook instances, this demo instance does not allow you to
              register a new account.
              <hr />
              <button
                type="button"
                className="btn btn-sm btn-outline-dark float-right"
                onClick={togglePopup}
              >
                Close popup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

PageloadPopup.propTypes = {
  togglePopup: PropTypes.func.isRequired,
};

export default PageloadPopup;
