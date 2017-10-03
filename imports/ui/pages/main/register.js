import { Template } from 'meteor/templating';

import Register from './register.jsx';
import './register.scss';
import './register.html';


Template.register.helpers({
	Register(){
		return Register
	}
})

