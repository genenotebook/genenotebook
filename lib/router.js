Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading',
	deniedTemplate:'denied'
});

Router.route('/');

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

Router.route('admin',{
	name:'admin',
	template:'admin',
	fastRender:true,
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
		return Meteor.subscribe('singleGene',this.params._id);
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
		//var gene = Genes.findOne({'ID':this.params._id});
		//Genes.update(
		//	{ _id: gene._id },
		//	{ $pull: { 'viewing': Meteor.userId() } }
		//)
		Session.set('editInfo',false)
		Session.set('search',undefined)
		delete Session.keys['search']
		Meteor.call('removeFromViewing',this.params._id);
	}
})
/*
Router.route('gene/:_id',{
	name:'gene',
	template:'feature',
	fastRender:true,
	onBeforeAction: function() {
		var currentUser = Meteor.user();
		if(currentUser){
			if (Roles.userIsInRole(currentUser,'user')){
				
				//add current userId to viewing array to keep track of who is viewing this gene
				//Genes.update(
				//	{ 'ID': this.params._id },
				//	{ $addToSet: { 'viewing': Meteor.userId() } }
				//)
				
				//get the gene info
				var gene = Genes.findOne({'ID':this.params._id});
				
				
				var geneData = Genes.findAndModify({
					query: { _id: gene._id },
					update: { $addToSet: { 'viewing': Meteor.userId() } },
					new: true 
				})
				console.log(geneData)
				if (geneData !== undefined) {
					this.render('feature',{data:geneData});
				} else {
					this.render('appNotFound');
				}
			} else {
				this.render('denied');
			}
		} else {
			this.render('login');
		}
	},
	waitOn: function(){
		return [
		Meteor.subscribe('singleGene',this.params._id)
		];
	},
	onStop: function(){
		console.log(this)
		var gene = Genes.findOne({'ID':this.params._id});
		Genes.update(
			{ _id: gene._id },
			{ $pull: { 'viewing': Meteor.userId() } }
		)
		Session.set('editInfo',false)
		Session.set('search',undefined)
		delete Session.keys['search']
	}
})
*/