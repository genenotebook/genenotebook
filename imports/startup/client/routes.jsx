import { FlowRouter } from 'meteor/kadira:flow-router';

import { Roles } from 'meteor/alanning:roles';
import { Session } from 'meteor/session';

import React from 'react';
import { mount } from 'react-mounter';

// Import to load these templates

import MainLayout from '/imports/ui/main/MainLayout.jsx';
import Login from '/imports/ui/main/Login.jsx';
import Register from '/imports/ui/main/Register.jsx';
import InactiveAccountWarning from '/imports/ui/main/InactiveAccountWarning.jsx';
import NotFound from '/imports/ui/main/NotFound.jsx';

import Landingpage from '/imports/ui/landingpage/Landingpage.jsx';

import GeneListWithOptions from '/imports/ui/genelist/GeneListWithOptions.jsx';

import Feature from '/imports/ui/feature/Feature.jsx';

import SubmitBlast from '/imports/ui/blast/SubmitBlast.jsx';
import BlastResult from '/imports/ui/blast/BlastResult.jsx';

import UserProfile from '/imports/ui/user-profile/UserProfile.jsx';

import Admin from '/imports/ui/admin/Admin.jsx';

import Download from '/imports/ui/download/Download.jsx';


const exposedRoutes = FlowRouter.group({})

const loggedInRoutes = FlowRouter.group({
  triggersEnter: [
    (context, redirect) => {
      const loggingIn = Meteor.loggingIn();
      const userId = Meteor.userId();
      const loggedIn = !!userId;
      const route = FlowRouter.current();
      if (!loggedIn && !loggingIn){
        if (route.route.name !== 'login') {
          Session.set('redirectAfterLogin',route.path)
        }
        redirect('/login');
      }
      const hasAccess = Roles.userIsInRole(userId, 'user');
      if (!hasAccess && context.path !== '/profile'){
        //redirect('/inactive-account');
      }
    }
  ]
})

const adminRoutes = loggedInRoutes.group({
  prefix: '/admin',
  triggersEnter: [
    () => {
      const isAdmin = Roles.userIsInRole(Meteor.userId(),'admin');
      if (!isAdmin){
        return FlowRouter.go('/')
      }
    }
  ]
})

FlowRouter.notFound = {
  action(){
    mount(MainLayout, {
      content: <NotFound />
    })
  }
}

exposedRoutes.route('/', {
  name: 'landingpage',
  action() {
    mount(MainLayout, { 
      content: <Landingpage />
    })
  }
})

exposedRoutes.route('/login', {
  name: 'login',
  action() {
    mount(MainLayout, {
      content: <Login />
    })
  }
})


exposedRoutes.route('/register', {
  name: 'register',
  action() {
    mount(MainLayout, {
      content: <Register />
    })
  }
})


exposedRoutes.route('/download/:_id', {
  name: 'download',
  action() {
    mount(MainLayout, {
      content: <Download />
    })
  }
})

exposedRoutes.route('/download/file/(.*)',{});


exposedRoutes.route('/inactive-account', {
  name: 'inactive-account',
  action(){
    mount(MainLayout, {
      content: <InactiveAccountWarning />
    })
  }
})

loggedInRoutes.route('/genes', {
  name: 'genes',
  action() {
    mount(MainLayout, {
      content: <GeneListWithOptions />
    })
  }
})

loggedInRoutes.route('/gene/:_id', {
  name: 'gene',
  action() {
    mount(MainLayout, {
      content: <Feature />
    })
  }
})


loggedInRoutes.route('/blast', {
  name: 'blast',
  action() {
    mount(MainLayout, {
      content: <SubmitBlast />
    })
  }
})

loggedInRoutes.route('/blast/:_id', {
  name: 'blastResult',
  action() {
    mount(MainLayout, {
      content: <BlastResult />
    })
  }
})

/*
loggedInRoutes.route('/search=:_search', {
  name: 'search',
  action() {
    BlazeLayout.render('appBody', { main: 'genelist' })
  }
})

*/


loggedInRoutes.route('/profile', {
  name: 'userProfile',
  action() {
    mount(MainLayout, {
      content: <UserProfile />
    })
  }
})


adminRoutes.route('/', {
  name: 'admin',
  action() {
    FlowRouter.redirect('/admin/users')
  }
})

//all admin routes have /admin as prefix
adminRoutes.route('/:_id', {
  name: 'admin',
  action() {
    mount(MainLayout, {
      content: <Admin />
    })
  }
})

adminRoutes.route('/user/:_id', {
  name: 'userProfileAdmin',
  action() {
    mount(MainLayout, {
      content: <UserProfile />
    })
  }
})
