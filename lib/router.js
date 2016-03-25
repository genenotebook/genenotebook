Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading'
});

Router.route('/');
Router.route('signin');

Router.route('genelist',{
	name: 'genelist',
	template: 'genelist',
	fastRender: true,
	onBeforeAction: function() {
		var currentUser = Meteor.user();
		if(currentUser){
			//var page = this.params._page;
			//var itemsPerPage = 10;
			//Pages.sess("currentPage", page);
			//var page = Session.get('page')
			//if (typeof page === 'undefined') {
			//	Session.set('page',1)
			//}
			this.next();
		} else {
			this.render('appNotFound');
		}
	},
	waitOn: function(){
		return [
		Meteor.subscribe('genes')
		];
	},
});

Router.route('browser/:_id',{
	name:'browser',
	template:'browser',
	onBeforeAction: function(){
		var currentUser = Meteor.user();
		if (currentUser) {
			//console.log(this.params._id)
			var sample = Tracks.findOne({'track':this.params._id});
			//var sample = Tracks.findOne({});
			//console.log(sample);
			if (sample !== undefined) {
				this.render('browser',{'data':sample});
			} else {
				this.render('appNotFound');
			}
		} else {
			this.render('appNotFound');
		}
	},waitOn: function(){
		return [
		Meteor.subscribe('tracks'),
		Meteor.subscribe('browser')
		];
	}
})

Router.route('gene/:_id',{
	name:'gene',
	template:'feature',
	onBeforeAction: function() {
		var currentUser = Meteor.user();
		if(currentUser){
			console.log('onBeforeAction',this.params._id)
			var item = Genes.findOne({'ID':this.params._id});
			if (item !== undefined) {
				this.render('feature',{data:item});
			} else {
				this.render('appNotFound');
			}
		} else {
			this.render('appNotFound');
		}
	},
	waitOn: function(){
		return [
		Meteor.subscribe('singleGene',this.params._id)
		];
	}
})