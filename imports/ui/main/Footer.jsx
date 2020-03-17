import { Meteor } from 'meteor/meteor';

import React, { useState } from 'react';
import getVersion from '/imports/api/methods/getVersion.js';

import './footer.scss';

export default function Footer() {
  const urlPrefix = Meteor.absoluteUrl();
  const [version, setVersion] = useState('...');
  getVersion.call({}, (err, res) => {
    if (err) console.error(err);
    setVersion(res);
  });
  return (
    <footer className="footer is-light has-text-centered">
      <a
        href="https://genenotebook.github.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="content columns is-centered is-vcentered has-text-grey-light"
      >
        <div className="column is-narrow">
          <figure className="image is-32x32">
            <img
              src={`${urlPrefix}logo_greyscale.svg`}
              alt="GeneNoteBook logo"
              className="is-rounded"
            />
          </figure>
        </div>
        <div className="column is-narrow">
          <span>
            <em>
              {`GeneNoteBook v${version}`}
            </em>
          </span>
        </div>
      </a>
      <p className="has-text-grey-light">© 2017-2020</p>
    </footer>
  );
}
