Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading',
	deniedTemplate:'denied'
});


Router.route('cli_test',{
	where:'server'
}).get( function(){
	this.render('appNotFound');
	console.log('REST get cli_test')
	console.log(this.request.connection.remoteAddress)
	
	if ( false ) {
	    this.response.statusCode = 200;
	    this.response.end( 'cli_test' );
	  } else {
	    this.response.statusCode = 404;
	    this.response.end( { status: "404", message: "Not found." }.toString() );
	  }

}).post( function(){

}).put( function(){

}).delete( function(){

});

Router.route('login',{
	name:'login',
	template:'login',
	onBeforeAction: function(){
		const currentUser = Meteor.userId();
		if (currentUser){
			Router.go('/')
		} else {
			this.next();
		}
	}
})

Router.route('register',{
	name:'register',
	template:'register',
	onBeforeAction: function(){
		const currentUser = Meteor.userId();
		if (currentUser){
			Router.go('/')
		} else {
			this.next();
		}
	}
})

Router.route('profile',{
	name:'userProfile',
	template:'userProfile',
	onBeforeAction: function(){
		const currentUser = Meteor.userId();
		if (currentUser){
			this.next()
		} else {
			Router.go('login');
		}
	}
})

Router.route('admin',{
	name:'admin',
	template:'admin',
	//fastRender:true,
	waitOn: function(){
		return [
			Meteor.subscribe('userList'),
			Meteor.subscribe('tracks'),
			Meteor.subscribe('experiments')
		];
	},
	onBeforeAction: function(){
		const currentUser = Meteor.userId();
		if (currentUser){
			if (Roles.userIsInRole(currentUser, 'admin')){
				this.next();
			} else {
				this.render('appNotFound');
			}
		} else {
			this.render('login')
		}
		
	}
});

Router.route('genes',{
	name: 'genes',
	template: 'genelist',
	fastRender: true,
	onBeforeAction: function() {
		const currentUser = Meteor.user();
		if(currentUser){
			if (Roles.userIsInRole(currentUser,'user')){
				const search = this.params.query.search;
				if (search){
					Session.set('search',search)
				}
				this.next();
			} else {
				this.render('denied')
			}
			
		} else {
			this.render('login');
		}
	},
	waitOn: function(){
		return [
			Meteor.subscribe('genes'),
			Meteor.subscribe('tracks'),
			Meteor.subscribe('filterOptions')
		];
	}
});

Router.route('blast',{
	name: 'blast',
	template: 'blast',
	fastRender: true,
	onBeforeAction: function(){
		const currentUser = Meteor.user();
		if (currentUser){
			if (Roles.userIsInRole(currentUser,'user')){
				this.next();
			} else {
				this.render('denied');
			}
		} else {
			this.render('login')
		}
	},
	waitOn: function(){
		return [
			Meteor.subscribe('tracks')
		]
	},
	onAfterAction: function(){
		const delKeys = ['blastInput','anyTrack','blastResult'];
		for (let key of delKeys){
			Session.set(key,undefined)
			delete Session.keys[key]
		}
	}
})

/*
Router.route('browser/:_id',{
	name:'browser',
	template:'browser',
	onBeforeAction: function(){
		const currentUser = Meteor.user();
		if (currentUser) {
			if (Roles.userIsInRole(currentUser,'user')){
				const sample = Tracks.findOne({'track':this.params._id});
				if (sample !== undefined) {
					this.render('browser',{'data':sample});
				} else {
					this.render('appNotFound');
				}
			} else {
				this.render('denied');
			} 
		} else {
			this.render('login');
		}
	},waitOn: function(){
		return [
		Meteor.subscribe('tracks'),
		Meteor.subscribe('browser')
		];
	}
})
*/

Router.route('search=:_search',{
	name:'search',
	template:'genelist',
	fastRender:true,
	onBeforeAction: function(){
		var currentUser = Meteor.user();
		if(currentUser){
			Session.set('search',this.params._search);
			this.next()
		} else {
			this.render('login');
		}
	}
})

Router.route('gene/:_id',{
	name:'gene',
	template:'feature',
	fastRender:true,
	waitOn: function(){
		return [
		 Meteor.subscribe('singleGene',this.params._id),
		 Meteor.subscribe('userList')
		];
	},
	onBeforeAction: function() {
		var currentUser = Meteor.user();
		if ( currentUser ){
			if ( Roles.userIsInRole(currentUser, 'user') ){
				const geneData = Genes.findOne({ 'ID': this.params._id })
				if ( geneData === undefined ){
					this.render('appNotFound');
				} else {
					this.render('feature',{ data: geneData })
				}
			} else {
				this.render('denied');
			}
		} else {
			this.render('login');
		}
	},
	onStop: function(){
		Session.set('search',undefined)
		delete Session.keys['search']
		Meteor.call('removeFromViewing',this.params._id);
		Meteor.call('unlock.gene',this.params._id);
		Session.set('showHistory',false)
	}
})
