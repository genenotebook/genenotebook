import { Meteor } from 'meteor/meteor';

import React from 'react';
import { render } from 'react-dom';
import WebFont from 'webfontloader';

import '/imports/startup/client/download-routes.js';

import App from '/imports/ui/main/App.jsx';

import '/imports/ui/global_stylesheets/global.scss';
import '/node_modules/bulma/css/bulma.css';

WebFont.load({
  google: {
    families: ['Roboto:300'],
  },
});

Meteor.startup(() => {
  render(<App />, document.getElementById('genenotebook-root'));
});
