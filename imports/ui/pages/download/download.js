import { Template } from 'meteor/templating';

import Download from './Download.jsx';

import './download.html';

Template.download.helpers({
  Download(){
    return Download
  }
})
