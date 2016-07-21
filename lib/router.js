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
			Meteor.subscribe('userList'),
			Meteor.subscribe('tracks')
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
	}/*,
	data: function(){
		return Meteor.users.find({});
	}*/
});

Router.route('genes',{
	name: 'genes',
	template: 'genelist',
	fastRender: true,
	onBeforeAction: function() {
		const currentUser = Meteor.user();
		if(currentUser){
			const search = this.params.query.search;
			if (search){
				console.log(search)
				Session.set('search',search)
			}
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
	}
});

Router.route('blast',{
	name: 'blast',
	template: 'blast',
	fastRender: true,
	onBeforeAction: function(){
		const currentUser = Meteor.user();
		if (currentUser){
			this.next()
		} else {
			this.render('appNotFound')
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