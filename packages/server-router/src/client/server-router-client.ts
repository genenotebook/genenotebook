/* globals document: false, window: false */
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import pathToRegexp from 'path-to-regexp';
import queryString from 'query-string';
import Url from 'url-parse';

/**
 * Client for ServerRouter
 *
 * @param options
 * @param {Routes} [options.routes={}] Known server-side routes. When providing this object you can
 * substitute function with anything other than object. For example:
 * ```javascript
 * const x: any = 1;
 * const routes: Routes = {
 *   Reports: {
 *     genReport: x,
 *     genReport2: x,
 *   },
 * };
 * ```
 * This is used to populate {@link #ServerRouterClient#url} and
 * @param {string} [options.defaultRoutePath=/r/:name/:args*] Same as in {@link ServerRouter}.
 */
export class ServerRouterClient<R extends Routes> {
  constructor(options) {
    const {
      routes,
      defaultRoutePath
    } = Object.assign({
      routes: {},
      defaultRoutePath: '/r/:name/:args*'
    }, options);
    this._routes = routes;
    this._defaultRoutePath = pathToRegexp.compile(defaultRoutePath);
    this.path = this._createRouteHandlers();
    this.redirect = this._createRouteHandlers({
      redirect: true
    });
    const shouldRefresh = Array.from(document.getElementsByTagName('meta')).some(el => el.getAttribute('data-server-router-authentication-required'));

    if (!shouldRefresh || !Meteor.userId()) {
      return;
    }

    this.redirectTo(window.location.href);
  }
  /**
   * Convenient methods for redirecting to a server route with authentication.
   * @example
   * serverRouterClient.redirect.privateImages.img1(800, 600);
   */


  /**
   * Redirects to given path with authentication. If you want to redirect to a publicly available
   * route, you can just do:
   * ```javascript
   * window.location.href = 'http://www.meteor.com/';
   * ```
   *
   * Returns a promise so you catch any errors connected with the authentication itself.
   */
  async redirectTo(path) {
    window.location.href = await this.authenticatePath(path);
  }
  /**
   * Redirects to given route and args with authenication. Short for (example):
   * ```javascript
   * serverRouterClient.redirectTo(serverRouterClient.getRoutePath('privateImages.img1', 800, 600));
   * ```
   *
   * Returns a promise for the same reason like {@link #ServerRouterClient#redirectTo}.
   */


  async redirectToRoute(name, ...args) {
    return this.redirectTo(this.getRoutePath(name, ...args));
  }
  /**
   * Returns authenticated version of given path, or the path itself if no current user.
   *
   * Throws on authentication problems.
   */


  async authenticatePath(path) {
    const userId = Meteor.userId();

    if (!userId) {
      return path;
    }

    const token = await new Promise((resolve, reject) => {
      Meteor.call('_ServerRouterGetUserToken', (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    const url = new Url(path);
    const query = queryString.parse(url.query);
    Object.assign(query, {
      _u: userId,
      _t: token
    });
    url.set('query', queryString.stringify(query));
    return url.toString();
  }
  /**
   * Returns unauthenticated path for given route and args.
   */


  getRoutePath(name, ...args) {
    return this._defaultRoutePath({
      name,
      args: args.map(EJSON.stringify)
    });
  }

  _createRouteHandlers(options) {
    const {
      redirect
    } = options || {}; // non-object values are mapped to route calls

    const routes = mapValuesDeep(this._routes, (value, name) => (...args) => {
      const path = this.getRoutePath(name, ...args);

      if (!redirect) {
        return path;
      }

      return this.redirectTo(path);
    });
    return routes;
  }

}

function mapValuesDeep(obj, mapper, keyPrefix) {
  const ret = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const deepKey = (keyPrefix || '') + key;

    if (typeof value === 'object' && value != null) {
      ret[key] = mapValuesDeep(value, mapper, `${deepKey}.`);
    } else {
      ret[key] = mapper(value, deepKey);
    }
  });
  return ret;
}
