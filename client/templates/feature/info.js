import { diff, apply } from 'rus-diff'; 
import clone from 'lodash/clone';

Session.setDefault('reversions',[])
Session.setDefault('viewingHistory',false)

Template.info.helpers({
	attributes(){
		return Object.keys(this.attributes).map((key) => {
			return {key: key, value: this.attributes[key]}
		})
	},
	editing(){
		return this.editing === Meteor.userId()
	},
	editNumber(){
		return EditHistory.find({ID:this.ID}).count()
	},
	currentVersion(){
		const reversions = Session.get('reversions');
		const totalVersions = EditHistory.find({ID:this.ID}).count();
		return totalVersions - reversions.length;
	},
	locked(){
		if (this.hasOwnProperty('editing')){
			return this.editing !== Meteor.userId
		}
	},
	author(){
		return this['Created by'];
	},
	isPseudogene(){
		if (this.hasOwnProperty('Pseudogene')){
			if (this.Pseudogene[0] === 'True'){
				return 'checked'
			}
		}
	},
	versionHistory(){
		const reversions = Session.get('reversions');
		if (reversions.length > 0){
			let current = clone(this);
			reversions.forEach( (reversion) => {
				let revertString = reversion.revert;
				let revertQuery = JSON.parse(revertString);
				current = apply(current,revertQuery);
			})
			return current;
		} else {
			return this;
		}
	},
	viewingHistory(){
		return Session.get('viewingHistory')
	}
})

Template.info.events({
	'click .edit': function(event,template){
		Meteor.call('lock.gene', this.ID, (err, res) => {
			if (err){
				Bert.alert('locking gene failed','danger','growl-bottom-right')
			} else {
				Bert.alert('Successfully locked gene','default','growl-bottom-right')
			}
		})
		
	},
	'click .save': function(event,template){
		let oldGene = this;
		let newGene = clone(this);

		const data = {
			Name: template.find('#Name').value,
			Comments: template.find('#Comments').value,
			Pseudogene: template.find('#Pseudogene').checked
		}
		
		if (data.Name.length === 0){
			if ( newGene.hasOwnProperty('Name') ){
				delete newGene.Name
			}
		} else {
			newGene.Name = [data.Name]
		}

		if (data.Comments.length === 0){
			if ( newGene.hasOwnProperty('Comments') ){
				delete newGene.Comments
			}
		} else {
			newGene.Comments = [data.Comments]
		}

		if (data.Pseudogene === true){
			newGene.Pseudogene = ['True']
		} else if (newGene.hasOwnProperty('Pseudogene')) {
			delete newGene.Pseudogene
		}

		newGene.changed = true;

		const update = diff(oldGene,newGene);
		const revert = diff(newGene,oldGene);
		
		if (update){
			Meteor.call('geneInfo.update',oldGene.ID,update,revert,function(error,result){
				if (error) {
					Bert.alert('Updating failed!','danger','growl-bottom-right')
				} else {
					Bert.alert('Succesfully updated','default','growl-bottom-right')
					Meteor.call('unlock.gene',oldGene.ID,function(err,res){
						if (err){
							Bert.alert('Unlocking failed','danger','growl-bottom-right')
						} else {
							Bert.alert('Gene unlocked','default','growl-bottom-right')
						}
					})
				}	
			});
		} else {
			Meteor.call('unlock.gene',oldGene.ID,function(err,res){
				if (err){
					Bert.alert('Unlocking failed','danger','growl-bottom-right')
				} else {
					Bert.alert('Gene unlocked','default','growl-bottom-right')
				}
			})
		}
		
		
	},
	'click .cancel': function(event,template){
		Meteor.call('unlock.gene',this.ID,function(err,res){
			if (err){
				Bert.alert('Unlocking failed','danger','growl-bottom-right')
			} else {
				Bert.alert('Gene unlocked','default','growl-bottom-right')
			}
		})
	},
	'click .hideHistory': function(event,template){
		Session.set('reversions',[]);
		Session.set('viewingHistory',false);
	},
	'click .viewingHistory':function(event,template){
		Session.set('viewingHistory',true)
	},
	'click .next':function(event,template){
		const reversions = Session.get('reversions');
		reversions.pop();
		Session.set('reversions',reversions);
	},
	'click .previous':function(event,template){
		const reversions = Session.get('reversions');
		const allVersions = EditHistory.find({ID:this.ID},{sort:{date:-1}}).fetch();
		if (reversions.length < allVersions.length){
			currentVersion = allVersions[reversions.length]
			reversions.push(currentVersion)
			Session.set('reversions',reversions);
		}
	}
})