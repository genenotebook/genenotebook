Meteor.subscribe('filterOptions');
Meteor.subscribe('tracks');

Session.setDefault('selectedFeatures',['Comment','Productname','Pseudogene','orthogroup','paralogs','singleton'])

Template.filter.helpers({
	hasFilter: function(){
		const filter = Session.get('filter');
		return !_.isEmpty(filter);
	},
	features: function(){
		const features = FilterOptions.find({});
		return features
	},
	selectedFeatures: function(){
		const selectedFeatures = Session.get('selectedFeatures')
		return FilterOptions.find({ _id: { $in: selectedFeatures } })
	},
	tracks:function(){
	    return Tracks.find({});
	},
	formatTrackName:function(trackName){
	    return trackName.split('.')[0];
	}
})

Template.filter.events({
	'click .featuremenu-item':function(event,template){
		const feature = event.target.text;
		const selectedFeatures = Session.get('selectedFeatures');
		if (selectedFeatures.indexOf(feature) < 0){
			selectedFeatures.push(feature);
		}
		Session.set('selectedFeatures',selectedFeatures);
	}
})