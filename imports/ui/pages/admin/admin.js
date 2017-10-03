import { Template } from 'meteor/templating';

import './admin.html';
import Admin from './admin.jsx';

Template.admin.helpers({
	Admin(){
		return Admin;
	}
})
