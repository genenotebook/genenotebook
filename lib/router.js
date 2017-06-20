/*

 Router.configure({
	layoutTemplate: 'appBody',
	notFoundTemplate: 'appNotFound',
	loadingTemplate: 'appLoading',
	deniedTemplate:'denied'
});

Router.route('/',{
	name: 'landingpage',
	template: 'landingpage'
});

*/

const exposedRoutes = FlowRouter.group({})

const loggedInRoutes = FlowRouter.group({
	triggersEnter: [
		() => {
			const route = FlowRouter.current();
			if (!(Meteor.loggingIn() || Meteor.userId())){
				if (route.route.name !== 'login') {
					Session.set('redirectAfterLogin',route.path)
				}
				return FlowRouter.go('login')
			}
		}
	]
})

const adminRoutes = loggedInRoutes.group({
	triggersEnter: [
		() => {
			if (!Roles.userIsInRole(Meteor.user(),['admin'])){
				return FlowRouter.go('/')
			}
		}
	]
})

exposedRoutes.notFound = {
	action(){
		BlazeLayout.render('appBody', { main: 'appNotFound' }) 
	}
}

exposedRoutes.route('/', {
	name: 'landingpage',
	action() {
		BlazeLayout.render('appBody', { main: 'landingpage' })
	}
})

exposedRoutes.route('/login', {
	name: 'login',
	action() {
		BlazeLayout.render('appBody', { main: 'login' })
	}
})
/*
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
*/

exposedRoutes.route('/register', {
	name: 'register',
	action() {
		BlazeLayout.render('appBody', { main: 'register' })
	}
})

/*

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

*/

loggedInRoutes.route('/profile', {
	name: 'profile',
	action() {
		BlazeLayout.render('appBody', { main: 'userProfile' })
	}
})

/*

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

*/

adminRoutes.route('/admin', {
	name: 'admin',
	action() {
		BlazeLayout.render('appBody', { main: 'admin' })
	}
})

/*

Router.route('admin',{
	name:'admin',
	template:'admin',
	fastRender:true,
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

*/

loggedInRoutes.route('/genes', {
	name: 'genes',
	action() {
		BlazeLayout.render('appBody', { main: 'genelist' })
	}
})

/*

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
	}
});

*/

loggedInRoutes.route('/blast', {
	name: 'blast',
	action() {
		BlazeLayout.render('appBody', { main: 'blast' })
	}
})

/*

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
	onAfterAction: function(){
		const delKeys = ['blastInput','anyTrack','blastResult'];
		for (let key of delKeys){
			Session.set(key,undefined)
			delete Session.keys[key]
		}
	}
})

*/

loggedInRoutes.route('/search=:_search', {
	name: 'search',
	action() {
		BlazeLayout.render('appBody', { main: 'genelist' })
	}
})

/*

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

*/

loggedInRoutes.route('/gene/:_id', {
	name: 'gene',
	action() {
		BlazeLayout.render('appBody', { main: 'feature' })
	}
})

/*

Router.route('gene/:_id',{
	name:'gene',
	template:'feature',
	fastRender:true,
	data() {
		return {
			geneId: this.params._id
		}
	},
	onBeforeAction() {
		var currentUser = Meteor.user();
		if ( currentUser ){
			if ( Roles.userIsInRole(currentUser, 'user') ){
				this.next()
			} else {
				this.render('denied');
			}
		} else {
			this.render('login');
		}
	},
	onStop(){
		Session.set('search',undefined)
		delete Session.keys['search']
		Meteor.call('removeFromViewing',this.params._id);
		Meteor.call('unlockGene',this.params._id);
		Session.set('showHistory',false)
		Session.set('currentUserIsEditing',false)
	}
})
*/