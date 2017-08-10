import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';
//import { AccountsTemplates } from 'meteor/useraccounts:core';

// Import to load these templates
import '../../ui/layouts/app-body.js';

import '../../ui/pages/genelist/genelist.js';
import '../../ui/pages/feature/feature.js';
import '../../ui/pages/blast/blast.js';
import '../../ui/pages/admin/admin.js';
import '../../ui/pages/landingpage/landingpage.js';
import '../../ui/pages/user-profile/user-profile.js';

import '../../ui/components/denied.html';


import '../../ui/pages/main/login.js';
import '../../ui/pages/main/register.js';

import '../../ui/pages/app-not-found.js';

// Import to override accounts templates
//import '../../ui/accounts/accounts-templates.js';

// Below here are the route definitions
 
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


exposedRoutes.route('/register', {
  name: 'register',
  action() {
    BlazeLayout.render('appBody', { main: 'register' })
  }
})

loggedInRoutes.route('/profile', {
  name: 'profile',
  action() {
    BlazeLayout.render('appBody', { main: 'userProfile' })
  }
})

adminRoutes.route('/admin', {
  name: 'admin',
  action() {
    BlazeLayout.render('appBody', { main: 'admin' })
  }
})

loggedInRoutes.route('/genes', {
  name: 'genes',
  action() {
    BlazeLayout.render('appBody', { main: 'genelist' })
  }
})

loggedInRoutes.route('/blast', {
  name: 'blast',
  action() {
    BlazeLayout.render('appBody', { main: 'blast' })
  }
})

loggedInRoutes.route('/search=:_search', {
  name: 'search',
  action() {
    BlazeLayout.render('appBody', { main: 'genelist' })
  }
})


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