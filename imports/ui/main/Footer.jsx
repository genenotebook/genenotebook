import { Meteor } from 'meteor/meteor';

import React, { useState } from 'react';
import getVersion from '/imports/api/methods/getVersion.js';

export default function Footer() {
  const urlPrefix = Meteor.absoluteUrl();
  const [version, setVersion] = useState('...');
  getVersion.call({}, (err, res) => {
    if (err) console.error(err);
    setVersion(res);
  });
  return (
    <footer className="footer py-1 my-auto bg-light border">
      <div className="container">
        <a
          href="https://genenotebook.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#A9A9A9',
          }}
        >
          <small>
            <img
              src={`${urlPrefix}logo_greyscale.svg`}
              alt="GeneNoteBook logo"
              className="footer-logo rounded-circle border"
              style={{
                width: '26px',
                marginTop: '0px',
                marginRight: '5px',
              }}
            />
            <em>
GeneNoteBook v
              {version}
            </em>
          </small>
        </a>
      </div>
    </footer>
  );
}
