import React, { useState } from 'react';
import getVersion from '/imports/api/methods/getVersion.js';

export default function Footer() {
  const [version, setVersion] = useState('...');
  getVersion.call({}, (err, res) => {
    if (err) console.error(err);
    setVersion(res);
  });
  return (
    <footer className="footer py-1 my-auto bg-light border">
      <div className="container">
        <span className="text-muted">
          <small>
GeneNoteBook v
            {version}
          </small>
        </span>
      </div>
    </footer>
  );
}
