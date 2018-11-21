import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import logger from '/imports/api/util/logger.js';

WebApp.connectHandlers.use(
  Meteor.bindEnvironment(function(req, res, next){
    logger.debug('absoluteUrl: ' + Meteor.absoluteUrl())
    req.dynamicHead = (req.dynamicHead || '');
    //req.dynamicHead += '<meta name="test">'
    ['fontello.css','animation.css'].forEach(file => {
      req.dynamicHead += `<link rel='stylesheet' type='text/css' href='${Meteor.absoluteUrl()}/fontello/css/${file}'>`
    })
    next();
  })
)