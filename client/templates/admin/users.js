Session.set('editUsers',[])

Template.users.helpers({
	edit : function(ID){
		const edit = Session.get('editUsers');
		return edit.indexOf(ID) > -1;
	}
})

Template.users.events({
	'click .edit':function(event){
		const id = event.target.id;
		const edit = Session.get('editUsers');
		edit.push(id);
		Session.set('editUsers',edit);
	},
	'click .cancel':function(event){
		const id = event.target.form.id;
		const edit = Session.get('editUsers');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editUsers',edit);
	},
	'click .save':function(event, template){
		const id = event.target.form.id;
		const selector = '#' + id.replace(/(:|\.|\[|\]|,|\/)/g,'\\$1')
		
		const data = {
			username: template.find('#username').value
		}

		const name = $(selector).find('#name').val();
		const exp = $(selector).find('#experiment').val();
		const descr = $(selector).find('#description').val();
		
		Meteor.call('experiments.update',this._id,{'ID':name,'experiment':exp,'description':descr})
		const edit = Session.get('editUsers');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editUsers',edit);
	}
})