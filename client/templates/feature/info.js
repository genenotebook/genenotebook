Session.set('editInfo',false)

Template.info.helpers({
	editing:function(){
		return Session.get('editInfo')
	},
	author:function(){
		return this['Created by'];
	},
	attributes:function(){
		console.log(this);
	},
	isPseudogene:function(){
		if (this.Pseudogene[0] === 'True'){
			return 'checked'
		}
	}
})

Template.info.events({
	'click .edit': function(event,template){
		const edit = Session.get('editInfo');
		Session.set('editInfo',!edit);
	},
	'click .save': function(event,template){
		const data = {
			Name:template.find('#Name').value,
			Comments: template.find('#Comments').value,
			changed: {
				author:Meteor.userId(),
				createdAt: new Date()
			}
		}

		Meteor.call('geneInfo.update',this._id,data,function(error,result){
			if (error) {
				Bert.alert('Updating failed!','danger','growl-top-right')
			}
			Bert.alert('Succesfully updated','success','growl-top-right')
		});

		const edit = Session.get('editInfo');
		Session.set('editInfo',!edit);
	},
	'click .cancel': function(event,template){
		const edit = Session.get('editInfo');
		Session.set('editInfo',!edit);
	}
})