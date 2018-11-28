import { Meteor } from 'meteor/meteor';

import React from 'react';
import { render } from 'react-dom';
import WebFont from 'webfontloader';

import { setBaseUrl } from '/imports/api/methods/setBaseUrl.js';

import App from '/imports/ui/main/App.jsx';

import '/imports/ui/global_stylesheets/global.scss';

WebFont.load({
  google: {
    families: ['Roboto:300']
  },
});

Meteor.startup(() => {
  setBaseUrl.call();
  console.log(Meteor)
  render(<App />, document.getElementById('genenotebook-root'));
});