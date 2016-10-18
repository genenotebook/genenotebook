import { diff, apply } from 'rus-diff'; 

_ = lodash;

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
		if (this.hasOwnProperty('Pseudogene')){
			if (this.Pseudogene[0] === 'True'){
				return 'checked'
			}
		}
	}
})

Template.info.events({
	'click .edit': function(event,template){
		const edit = Session.get('editInfo');
		Session.set('editInfo',!edit);
	},
	'click .save': function(event,template){
		let newGene = _.clone(this);

		const data = {
			Name: template.find('#Name').value,
			Comments: template.find('#Comments').value,
			Pseudogene: template.find('#Pseudogene').checked
		}

		console.log(data)
		
		if (data.Name !== ''){
			newGene.Name = [data.Name]
		}
		if (data.Comments !== ''){
			newGene.Comments = [data.Comments]
		}

		if (data.Pseudogene === true){
			newGene.Pseudogene = true
		} else if (newGene.hasOwnProperty('Pseudogene')) {
			delete newGene.Pseudogene
		}

		const delta = diff(newGene,this);
		console.log(delta);
		const reset = apply(newGene,delta)
		console.log(_.isEqual(reset,this))


		Meteor.call('geneInfo.update',newGene,delta,function(error,result){
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