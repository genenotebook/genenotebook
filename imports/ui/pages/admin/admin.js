import { Template } from 'meteor/templating';

import './admin.html';
import Admin from './admin.jsx';
/*
import './admin_attributes.js';
import './admin_experiments.js';
import './admin_genomes.js';
import './admin_tracks.js';
import './admin_users.js';
*/

Template.admin.helpers({
	Admin(){
		return Admin;
	}
})
