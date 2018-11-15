import { Meteor } from 'meteor/meteor';

import React from 'react';
import { render } from 'react-dom';
import WebFont from 'webfontloader';

import App from '/imports/ui/main/App.jsx';

import '/imports/ui/global_stylesheets/global.scss';

//global.Buffer = global.Buffer || require("buffer").Buffer;

WebFont.load({
  google: {
    families: ['Roboto:300']
  },
  /*custom: {
    families: ['fontello'],
    urls: ['fontello/css/fontello.css', 'fontello/css/animate.css']
  }*/
});

Meteor.startup(() => {
  render(<App />, document.getElementById('genenotebook-root'));
});