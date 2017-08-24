import { Template } from 'meteor/templating';

import './user-profile.html';
import userProfile from './user-profile.jsx';

Template.userProfile.helpers({
  userProfile(){
    return userProfile;
  }
})