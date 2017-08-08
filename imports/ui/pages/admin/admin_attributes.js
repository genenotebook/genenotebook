import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './admin_attributes.html';

Session.set('editAttributes',[])

Template.adminAttributes.helpers({
	edit : function(ID){
		const edit = Session.get('editAttributes');
		return edit.indexOf(ID) > -1;
	},
	isVisual : function(){
		if (this.show){
			return 'checked'
		}
	}
})

Template.adminAttributes.events({
	'click #refresh':function(){
		Meteor.call('scanFeatures',function(err,res){
			if (err){
				Bert.alert('Attribute update failed','danger','growl-top-right');
			} else {
				Bert.alert('Attribute updated','success','growl-top-right');
			}
		})
	},
	'click .edit':function(event){
		const id = event.target.id;
		const edit = Session.get('editAttributes');
		edit.push(id);
		Session.set('editAttributes',edit);
	},
	'click .cancel':function(event){
		const id = event.target.form.id;
		const edit = Session.get('editAttributes');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editAttributes',edit);
	},
	'click .save':function(event, template){
		const id = event.target.form.id;
		const selector = '#' + id.replace(/(:|\.|\[|\]|,|\/)/g,'\\$1')
		const data = {
			name: template.find('#name').value,
			show: template.find('#show').checked,
		}		
		console.log(data)
		Meteor.call('updateAttributes',this._id,data)
		const edit = Session.get('editAttributes');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editAttributes',edit);
	}
})