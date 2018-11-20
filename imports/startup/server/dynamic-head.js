import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use(
  Meteor.bindEnvironment(function(req, res, next){
    console.log(Meteor.absoluteUrl())
    req.dynamicHead = (req.dynamicHead || '');
    //req.dynamicHead += '<meta name="test">'
    ['fontello.css','animation.css'].forEach(file => {
      req.dynamicHead += `<link rel='stylesheet' type='text/css' href='${Meteor.absoluteUrl()}/fontello/css/${file}'>`
    })

    next();
  })
)