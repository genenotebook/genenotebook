import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use(
  Meteor.bindEnvironment((req, res, next) => {
    let url = Meteor.absoluteUrl();

    // When running a production server, PORT must be added when running as localhost
    if (Meteor.isProduction && /localhost/g.test(url)) {
      const { PORT } = process.env;
      url = url.replace(/\/$/, `:${PORT}/`);
    }

    req.dynamicHead = (req.dynamicHead || '');
    ['fontello.css', 'animation.css'].forEach((file) => {
      req.dynamicHead += `<link rel='stylesheet' type='text/css' href='${url}fontello/css/${file}'>`;
    });
    next();
  }),
);
