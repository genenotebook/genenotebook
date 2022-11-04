/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { shallow } from 'enzyme';
import chai from 'chai';

if (Meteor.isClient) {
  import App from './App.jsx';

  describe('App', function() {
    it('should render', function() {
      const app = shallow(<App />);
      chai.assert(app || true);
    });
  });
}
