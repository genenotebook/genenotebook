Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading'
});

Router.route('/');
Router.route('signin');

Router.route('genelist',{
	name: 'genelist',
	template: 'geneList',
	onBeforeAction: function() {
		var currentUser = Meteor.user();
		if(currentUser){
			this.next();
		} else {
			this.render('appNotFound');
		}
	},
	//onRun: function() {
	//	this.next();
	//},
	waitOn: function(){
		return [
		Meteor.subscribe('genes')
		];
	}
});