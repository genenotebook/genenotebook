import { Template } from 'meteor/templating';

import './info.html';

import Info from './Info.jsx';

Template.info.helpers({
	Info(){
		return Info;
	}
})
