import { Template } from 'meteor/templating';

import './user-profile.html';
import UserProfileContainer from './user-profile.jsx';

Template.userProfile.helpers({
  UserProfileContainer(){
    return UserProfileContainer;
  }
})