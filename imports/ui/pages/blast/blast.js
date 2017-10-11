import { Template } from 'meteor/templating';

import SubmitBlast from './SubmitBlast.jsx';

import './blast.html';

Template.blast.helpers({
	SubmitBlast(){
		return SubmitBlast
	}
})
