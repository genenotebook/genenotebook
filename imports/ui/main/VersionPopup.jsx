import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';

const pkginfo = { version: 'undetermined' };

function VersionPopup({ togglePopup }) {
  const { isProduction, isDevelopment } = Meteor;
  console.log({ isProduction, isDevelopment });
  return (
    <React.Fragment>
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
              <p>
                Version info:&nbsp;
                {pkginfo.version}
                <br />
                Is production:&nbsp;
                {String(isProduction)}
                <br />
                Is development:&nbsp;
                {String(isDevelopment)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

VersionPopup.propTypes = {
  togglePopup: PropTypes.func.isRequired,
};

export default VersionPopup;
