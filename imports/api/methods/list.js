import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import { ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';


Meteor.methods({
	list: function(what){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		let retval;
		switch( what ){
			case 'tracks':
				retval = Tracks.find({},{ fields: { _id: 0}}).fetch();
				break;
			case 'references':
				retval = ReferenceInfo.find(
					{},
					{ fields: { _id: 0, referenceName: 1 }}
					).fetch().map(function(ret){
						return ret.referenceName
					});
				break;
			default:
				throw new Meteor.Error('Can not list: ' + what) 
		}
		return [...new Set(retval)];
	}
})