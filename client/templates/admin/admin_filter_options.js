Session.set('editFilterOptions',[])

Template.adminFilterOptions.helpers({
	edit : function(ID){
		const edit = Session.get('editFilterOptions');
		return edit.indexOf(ID) > -1;
	},
	isVisual : function(){
		if (this.show){
			return 'checked'
		}
	}
})

Template.adminFilterOptions.events({
	'click #refresh':function(){
		Meteor.call('scan.features',function(err,res){
			if (err){
				Bert.alert('Filter update failed','danger','growl-top-right');
			} else {
				Bert.alert('Filters updated','success','growl-top-right');
			}
		})
	},
	'click .edit':function(event){
		const id = event.target.id;
		const edit = Session.get('editFilterOptions');
		edit.push(id);
		Session.set('editFilterOptions',edit);
	},
	'click .cancel':function(event){
		const id = event.target.form.id;
		const edit = Session.get('editFilterOptions');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editFilterOptions',edit);
	},
	'click .save':function(event, template){
		const id = event.target.form.id;
		const selector = '#' + id.replace(/(:|\.|\[|\]|,|\/)/g,'\\$1')
		const data = {
			name: template.find('#name').value,
			show: template.find('#show').checked,
		}		
		console.log(data)
		Meteor.call('filterOptions.update',this._id,data)
		const edit = Session.get('editFilterOptions');
		const index = edit.indexOf(id);
		if (index > -1){
			edit.splice(index,1);
		}
		Session.set('editFilterOptions',edit);
	}
})