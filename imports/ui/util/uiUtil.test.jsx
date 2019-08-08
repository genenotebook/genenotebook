/* eslint-env mocha */
// import { Factory } from 'meteor/dburles:factory';
// import { Meteor } from 'meteor/meteor';
import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import chai from 'chai';

import { Loading } from './uiUtil.jsx';

Enzyme.configure({ adapter: new Adapter() });

describe('Loading component', function() {
  console.log('describe');
  console.log(this);

  it('should have the loading class', function(done) {
    console.log('it');
    console.log(this);
    const component = shallow(<Loading test="test" />);
    console.log('component', component);
    chai.assert(true);
    console.log('assert');

    done();
  }).run();
});
