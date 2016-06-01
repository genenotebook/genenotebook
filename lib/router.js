Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading'
});

Router.route('/');
Router.route('admin',{
	name:'admin',
	template:'admin',
	fastRender:true,
	waitOn: function(){
		return [
			Meteor.subscribe('userList')
		];
	},
	onBeforeAction: function(){
		const currentUser = Meteor.userId();
		console.log(currentUser);
		if (Roles.userIsInRole(currentUser, 'admin')){
			this.next();
		} else {
			this.render('appNotFound');
		}
	},
	data: function(){
		return Meteor.users.find({});
	}
});

Router.route('genelist',{
	name: 'genelist',
	template: 'genelist',
	fastRender: true,
	onBeforeAction: function() {
		const currentUser = Meteor.user();
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
		Meteor.subscribe('genes')//,
		//Meteor.subscribe('interpro')
		];
	},
});

Router.route('browser/:_id',{
	name:'browser',
	template:'browser',
	onBeforeAction: function(){
		const currentUser = Meteor.user();
		if (currentUser) {
			//console.log(this.params._id)
			const sample = Tracks.findOne({'track':this.params._id});
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

Router.route('search=:_id',{
	name:'search',
	template:'genelist',
	fastRender:true,
	onBeforeAction: function(){
		var currentUser = Meteor.user();
		if(currentUser){
			//console.log('onBeforeAction',this.params._id)
			/*
			var searchResult = Genes.find({'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{limit:limit,sort:{'ID':1}});

			if (searchResult !== undefined) {
				this.render('feature',{data:item});
			} else {
				this.render('appNotFound');
			}
			*/
			Session.set('search',this.params._id);
			this.next()
		} else {
			this.render('appNotFound');
		}
	}
})

Router.route('gene/:_id',{
	name:'gene',
	template:'feature',
	fastRender:true,
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