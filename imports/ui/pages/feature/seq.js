import { Template } from 'meteor/templating';

import './seq.html';

import SeqContainer from './Seq.jsx';

Template.seq.helpers({
	SeqContainer(){
		return SeqContainer
	}
})
