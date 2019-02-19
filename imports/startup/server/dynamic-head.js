import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use(
  Meteor.bindEnvironment((req, res, next) => {
    req.dynamicHead = (req.dynamicHead || '');
    ['fontello.css', 'animation.css'].forEach((file) => {
      req.dynamicHead += `<link rel='stylesheet' type='text/css' href='${Meteor.absoluteUrl()}fontello/css/${file}'>`;
    });
    next();
  }),
);
