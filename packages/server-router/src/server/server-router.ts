/* globals WebAppInternals: false */
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebAppInternals } from 'meteor/webapp';
import invariant from 'invariant';
// import * as pathToRegexp from 'path-to-regexp';
const {pathToRegexp} = require('path-to-regexp');
import url from 'url';

/**
 * Server-side routing provider of the [connect](https://github.com/senchalabs/connect) API that
 * can be used with Meteor [webapp](https://docs.meteor.com/packages/webapp.html) package.
 *
 * @param options
 * @param {Array<Path>?} [options.paths=[]] Initial paths. You can add more with
 * {@link #ServerRouter#addPaths} or {@link #ServerRouter#addPath}.
 * @param {Routes?} [options.routes={}] Initial routes. You can add more with
 * {@link #ServerRouter#addRoutes}.
 * @param {string?} [options.defaultRoutePath=/r/:name/:args*] Any added {@link Route} can be
 * reached by this path when provided its nested name and arguments. See {@link Path} for more on
 * syntax. Should be unique for every ServerRouter instance (if you need more than one).
 * Arguments are serialized with [EJSON](https://docs.meteor.com/api/ejson.html) for transportation.
 *
 * @example
 * WebApp.connectHandlers.use((new ServerRouter({
 *   routes: { ... },
 *   paths: [ ... ],
 * })).middleware);
 * @example
 * WebApp.connectHandlers.use(ServerRouter.middleware({
 *   routes: { ... },
 *   paths: [ ... ],
 * }));
 * @example
 * const serverRouter = new ServerRouter();
 * WebApp.connectHandlers.use(serverRouter.middleware);
 *
 * serverRouter.addPaths([ ... ]);
 * serverRouter.addRoutes({ ... });
 */
export class ServerRouter {
  /**
   * Short for `(new ServerRouter(options)).middleware`.
   */
  static middleware(options) {
    return new this(options).middleware;
  }

  constructor(options) {
    const {
      routes,
      defaultRoutePath,
      paths
    } = Object.assign({
      routes: {},
      defaultRoutePath: '/r/:name/:args*',
      paths: []
    }, options);
    this._routes = {};
    this._paths = [];
    this.addPath({
      path: '/',
      options: {
        end: false
      },
      args: (params, query) => [query],

      async route(query) {
        const {
          _u: userId,
          _t: token
        } = query;

        if (!userId) {
          return false; // continue request processing
        }

        const matchedUsersCount = Meteor.users.find({
          _id: userId,
          _serverRouterTokens: {
            $elemMatch: {
              token,
              expiry: {
                $gte: Date.now()
              }
            }
          }
        }).count();
        const context = this;

        if (!matchedUsersCount) {
          throw new AuthenticationRequiredError();
        } // if token was matched - remove this and any old tokens


        Meteor.users.update(userId, {
          $pull: {
            _serverRouterTokens: {
              $or: [{
                token
              }, {
                expiry: {
                  $lt: Date.now()
                }
              }]
            }
          }
        });
        context.userId = userId;
        return false; // continue request processing
      }

    });
    const allRoutes = this._routes;
    this.addPath({
      path: defaultRoutePath,
      args: params => {
        const {
          name,
          args
        } = params;
        invariant(typeof name === 'string', 'name is string');
        invariant(args instanceof Array, 'args is an array');
        const parsedArgs = args.map(arg => {
          try {
            return EJSON.parse(arg);
          } catch (e) {
            throw new Error(`Error parsing '${arg}'`);
          }
        });
        return [name, ...parsedArgs];
      },

      async route(name, ...rest) {
        const route = getFieldValue(allRoutes, name);

        if (!route) {
          return false;
        }

        return route.apply(this, rest);
      }

    });
    this.addPaths(paths);
    this.addRoutes(routes);
    this.middleware = this._middleware.bind(this);
  }

  /**
   * Adds a single path.
   */
  addPath(data) {
    const {
      path,
      options,
      route,
      args
    } = data;
    const tokens = [];
    const regexp = pathToRegexp(path, tokens, options);

    this._paths.push({
      regexp,
      tokens,
      route,
      args
    });
  }
  /**
   * Adds a list of paths. Short for calling {@link #ServerRouter#addPath} a number of times.
   */


  addPaths(data) {
    data.forEach(this.addPath.bind(this));
  }
  /**
   * Merges new routes into existing routes.
   *
   * @example
   * serverRouter.addRoutes({
   *   myRoute() { ... },
   *   privateImages: {
   *     img1() { ... },
   *     img2() { ... },
   *   },
   * });
   */


  addRoutes(routes) {
    _.extend(this._routes, routes);
  }
  /**
   * Getter for middleware that used with Meteor's
   * [webapp](https://docs.meteor.com/packages/webapp.html) package.
   *
   * @example
   * WebApp.connectHandlers.use(serverRouter.middleware);
   */


  _middleware(req, res, next) {
    const {
      pathname,
      query
    } = url.parse(req.url, true);
    invariant(pathname, 'pathname is not falsy');
    invariant(query, 'query is not falsy');
    const context = {
      req,
      res,
      userId: null
    };
    const decodedPath = decodeURIComponent(pathname);
    const responseReady = {};

    this._paths.reduce((promise, path) => {
      const matches = path.regexp.exec(decodedPath);

      if (!matches) {
        return promise;
      }

      const params = {};
      matches.forEach((match, i) => {
        if (i === 0) {
          return;
        }

        const token = path.tokens[i - 1];

        if (token.repeat) {
          params[token.name] = match.split(token.delimiter);
        } else {
          params[token.name] = match;
        }
      });
      return promise.then(() => path.route.apply(context, path.args(params, query))).then(result => {
        if (result === false) {
          return;
        }

        throw responseReady;
      });
    }, Promise.resolve()).then(next, reason => {
      if (reason instanceof AuthenticationRequiredError) {
        markRequestForRedirect(req);
        next();
        return;
      }

      if (reason === responseReady) {
        return;
      }

      next(reason);
    });
  }

}

function getFieldValue(obj, field) {
  if (!obj) {
    return null;
  }

  return field.split('.').reduce((o, part) => o && o[part], obj);
}

const redirectedRequests = new Set();

function markRequestForRedirect(req) {
  redirectedRequests.add(req.headers);
}

WebAppInternals.registerBoilerplateDataCallback('mhagmajer:server-router', (req, data) => {
  if (!redirectedRequests.delete(req.headers)) {
    return false; // no changes made
  } // eslint-disable-next-line no-param-reassign


  data.head += '<meta data-server-router-authentication-required="1">';
  return true;
});
Meteor.methods({
  _ServerRouterGetUserToken() {
    const {
      userId
    } = this;

    if (!userId) {
      return null;
    }

    const token = Random.id();
    Meteor.users.update(userId, {
      $push: {
        _serverRouterTokens: {
          expiry: Date.now() + 60 * 1000,
          token
        }
      }
    });
    return token;
  }

});
/**
 * Thrown by routes when authentication is required for further processing.
 */

export class AuthenticationRequiredError {}
