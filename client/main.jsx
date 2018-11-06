//import '/imports/startup/client';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { render } from 'react-dom';

import App from '/imports/ui/main/App.jsx';

import '/imports/ui/global_stylesheets/global.scss';
import '/imports/ui/global_stylesheets/fontello/css/fontello.css';

Meteor.startup(() => {
  render(<App />, document.getElementById('genenotebook-root'));
});