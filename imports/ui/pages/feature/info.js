import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { diff, apply } from 'rus-diff'; 
import cloneDeep from 'lodash/cloneDeep';

import './info.html';
import './info.scss';

Session.setDefault('reversions',[])
Session.setDefault('removeAttributes',[])
Session.setDefault('viewingHistory',false)
Session.setDefault('currentUserIsEditing',false)
Session.setDefault('addingNewAttribute',false)

Template.info.helpers({
	attributes(){
		let removeAttributes = Session.get('removeAttributes')
		return Object.keys(this.attributes).map((key) => {
			return {key: key, value: this.attributes[key]}
		}).filter( (attribute) => {
			return removeAttributes.indexOf(attribute.key) < 0
		} )
	},
	availableAttributes(){
		const geneAttributes = Object.keys(this.attributes);
		return Attributes.find({reserved: false}).fetch().filter((attribute) => {
			geneAttributes.indexOf(attribute.ID) >= 0
		})
	},
	currentUserIsEditing(){
		return Session.get('currentUserIsEditing');
	},
	editNumber(){
		return EditHistory.find({ ID: this.ID }).count()
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
	versionHistory(){
		const reversions = Session.get('reversions');
		if (reversions.length > 0){
			let current = cloneDeep(this);
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
	},
	addingNewAttribute(){
		return Session.get('addingNewAttribute')
	}
})

Template.info.rendered = function(){

  $('#new-attribute').selectpicker({
    style: 'btn-success',
    size: 5,
    title:'Add new attribute',
    header: 'Select an existing attribute option, or make a new one'
  });

};

Template.info.events({
	'click .add-attribute': function(event, template){
		Session.set('addingNewAttribute',true)
	},
	'click .remove-attribute': function(event, template){
		console.log(event.target.id)
		let removeAttributes = Session.get('removeAttributes')
		removeAttributes.push(event.target.id)
		Session.set('removeAttributes',removeAttributes)

	},
	'click .edit': function(event,template){
		Meteor.call('lockGene', this.ID, (err, res) => {
			if (err){
				Bert.alert('locking gene failed','danger','growl-bottom-right')
			} else {
				Session.set('currentUserIsEditing',true)
				Bert.alert('Successfully locked gene','default','growl-bottom-right')
			}
		})
		
	},
	'click .save': function(event,template){
		let oldGene = this;
		let newGene = cloneDeep(this);
		let removeAttributes = Session.get('removeAttributes')

		Object.keys(this.attributes).filter( (key) => {
			return removeAttributes.indexOf(key) < 0
		}).forEach( (key) => {
			let value = template.find(`#${key}`).value;
			newGene.attributes[key] = value;
		} )

		removeAttributes.forEach( (attribute) => {
			delete newGene.attributes[attribute]
		} )

		let newAttribute = Session.get('addingNewAttribute')

		if (newAttribute){
			let newAttributeKey = template.find('#newAttributeKey').value;
			let newAttributeValue = template.find('#newAttributeValue').value;

			if (newAttributeKey.length === 0){
				Bert.alert('Fill in a new attribute key!', 'danger', 'growl-bottom-right')
				throw new Meteor.Error('Empty attribute key')
			}

			if (newAttributeValue.length === 0){
				Bert.alert('Fill in a new attribute value!', 'danger', 'growl-bottom-right')
				throw new Meteor.Error('Empty attribute value')
			}

			if (Object.keys(this.attributes).indexOf(newAttributeKey) >= 0){
				Bert.alert(`${newAttributeKey} is already an existing key!`, 'danger', 'growl-bottom-right')
				throw new Meteor.Error('Existing attribute key')
			}

			newGene.attributes[newAttributeKey] = encodeURI(newAttributeValue);
			Session.set('addingNewAttribute', false)
		}

		if (diff(oldGene,newGene)){
			newGene.changed = true;

			const update = diff(oldGene,newGene);
			const revert = diff(newGene,oldGene);

			Meteor.call('updateGeneInfo',oldGene.ID,update,revert,function(error,result){
				if (error) {
					Bert.alert('Updating failed!','danger','growl-bottom-right')
				} else {
					Bert.alert('Succesfully updated gene','success','growl-bottom-right')
					Meteor.call('unlockGene',oldGene.ID,function(err,res){
						if (err){
							Bert.alert('Unlocking failed','danger','growl-bottom-right')
						} else {
							Session.set('currentUserIsEditing',false)
							Bert.alert('Gene unlocked','default','growl-bottom-right')
						}
					})
				}	
			});
		} else {
			Meteor.call('unlockGene',oldGene.ID,function(err,res){
				if (err){
					Bert.alert('Unlocking failed','danger','growl-bottom-right')
				} else {
					Bert.alert('Gene unlocked','default','growl-bottom-right')
				}
			})
		}
	},
	'click .cancel': function(event,template){
		Session.set('removeAttributes',[])
		Session.set('addingNewAttribute',false)
		Meteor.call('unlockGene',this.ID,function(err,res){
			if (err){
				Bert.alert('Unlocking failed','danger','growl-bottom-right')
			} else {
				Bert.alert('Gene unlocked','default','growl-bottom-right')
				Session.set('currentUserIsEditing',false)
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