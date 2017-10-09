import { Template } from 'meteor/templating';

import SubmitBlast from './SubmitBlast.jsx';

import './blast.html';
import './blast.scss';


Template.blast.helpers({
	SubmitBlast(){
		return SubmitBlast
	}
})
