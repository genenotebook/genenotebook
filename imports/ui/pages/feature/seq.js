import { Template } from 'meteor/templating';

import './seq.html';

import SeqContainer from './seq.jsx';

Template.seq.helpers({
	SeqContainer(){
		return SeqContainer
	}
})
