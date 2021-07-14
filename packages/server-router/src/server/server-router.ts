/* eslint-disable max-classes-per-file */

/* globals WebAppInternals: false */

import { EJSON } from "meteor/ejson";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { WebAppInternals } from "meteor/webapp";
import invariant from "invariant";
import pathToRegexp from "path-to-regexp";
import url from "url";

import { IncomingMessage, ServerResponse } from "http";

/**
 * Basic object of the router representing a server-side path available via HTTP request.
 * For each `path` matching the request url, a handler ({@link Route}) is called with `this` bound
 * to the context of the request ({@link ServerRouterContext}).
 *
 * Initalized with the following data:
 *
 * - **path** ({@link string}): url path in format acceptable by
 * [path-to-regexp](https://www.npmjs.com/package/path-to-regexp).
 * - **options**: Optional data passed to `path-to-regexp`.
 *   - **sensitive** ({@link string} = `false`): When `true` the path will be case sensitive.
 *   - **strict** ({@link string} = `false`): When `false` the trailing slash is optional.
 *   - **end** ({@link string} = `false`): When `false` the path will match at the beginning.
 *   - **delimiter** ({@link string} = `/`): Set the default delimiter for repeat parameters.
 * - **args** ({@link ArgsMapper}) mapper of `params` and `query` to route arguments.
 * - **route** ({@link Route}) function to be called when `path` matches.
 *
 * @example
 * serverRouter.addPath({
 *   path: '/binary-representation/:n',
 *   args: ({ n }) => [Number(n)],
 *   async route(n) {
 *     this.res.end(n.toString(2));
 *   },
 * });
 * // GET /binary-representation/1337
 * // 10100111001
 * @example
 * serverRouter.addPath({
 *   path: '/sum/:n+',
 *   args: ({ n }) => n.map(Number),
 *   async route(...nums) {
 *     this.res.end(String(nums.reduce((a, b) => a + b)));
 *   },
 * });
 * // GET /sum/1/2/3
 * // 6
 * @example
 * serverRouter.addPath({
 *   path: '/get-query',
 *   args: (params, query) => [query],
 *   async route(query) {
 *     this.res.end(String(Object.keys(query)));
 *   },
 * });
 * // GET /get-query?a=&b=
 * // a,b
 */
type Path = {
  path: string;
  options?: {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
    delimiter?: string;
  };
  args: ArgsMapper;
  route: Route;
};

/**
 * Function used to map params and query to actual route arguments.
 *
 * @param {ObjectMap<string, string | Array<string>>} params name parameters matched in path.
 * @param {ObjectMap<string, string>} query url query parameters (following `?`).
 * @returns {Array<any>} arguments that the route will be called with.
 */
type ArgsMapper = (params: {
  [key: string]: string | Array<string>;
}, query: {
  [key: string]: string;
}) => Array<any>;

/**
 * Path handler called with `this` bound to {@link ServerRouterContext}.
 *
 * In order to respond to HTTP request, you should write to `this.res` object. By default, request
 * processing is finished once your handler finishes. If you want to disable this behavior, you can
 * `return false` to pass the processing to the next handler. Note that the response (`this.res`)
 * must eventually be ended during the HTTP request processing by a route within ServerRouter or
 * some other middleware.
 *
 * Any exceptions thrown in handlers other than {@link AuthenticationRequiredError} are presented
 * in response.
 *
 * @returns {Promise<boolean | void>} whether the request processing is complete (defaults to true).
 *
 * @throws {AuthenticationRequiredError} if access to this route requires authentication. It will
 * cause this route to be called again with `this.userId` to be set to the current user (if any).
 */
type Route = (...args: Array<any>) => Promise<void | boolean>;

/**
 * Object to which `this` is bound to inside your {@link Route} invocation. It provides the
 * following:
 *
 * - **req** ([IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)):
 * information about the incoming request.
 * - **res** ([ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse)):
 * use this to write data that should be sent in response to the request.
 * - **userId** ({@link string}?): the id of the current user.
 *
 * This object is preserved between calling matched routes, so you can augment it.
 */
export type ServerRouterContext = {
  req: IncomingMessage;
  res: ServerResponse;
  userId: string | null | undefined;
};

/**
 * Nested dictionary of {@link Route} functions. This allows for namespaces.
 * @example
 * serverRouter.addRoutes({
 *   reports: {
 *     salesPDF, // available by name 'reports.salesPDF'
 *     employeesPDF,
 *   },
 *   images: {
 *     pngs: {
 *       async logo() { ... }, // name: 'images.pngs.logo'
 *     },
 *   },
 * });
 */
type Routes = {
  [name: string]: Route | Routes;
};

type PathRegExp = {
  regexp: RegExp;
  tokens: Array<{
    name: string;
    delimiter: string;
  }>;
  route: Route;
  args: ArgsMapper;
};

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
  static middleware(options?: any) {
    return new this(options).middleware;
  }

  constructor(options?: {
    routes?: Routes;
    defaultRoutePath?: string;
    paths?: Array<Path>;
  }) {
    const {
      routes,
      defaultRoutePath,
      paths
    } = {
      routes: ({} as any),
      defaultRoutePath: '/r/:name/:args*',
      paths: [],
      ...options
    };

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

        const context = (this as ServerRouterContext);

        if (!matchedUsersCount) {
          throw new AuthenticationRequiredError();
        }

        // if token was matched - remove this and any old tokens
        Meteor.users.update(userId, {
          $pull: {
            _serverRouterTokens: {
              $or: [{
                token
              }, {
                expiry: { $lt: Date.now() }
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
      async route(name: string, ...rest) {
        const route: Route | null | undefined = getFieldValue(allRoutes, name);
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

  _paths: Array<PathRegExp>;

  _routes: Routes;

  /**
   * Adds a single path.
   */
  addPath(data: Path) {
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
  addPaths(data: Array<Path>) {
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
  addRoutes(routes: Routes) {
    _.extend(this._routes, routes);
  }

  /**
   * Getter for middleware that used with Meteor's
   * [webapp](https://docs.meteor.com/packages/webapp.html) package.
   *
   * @example
   * WebApp.connectHandlers.use(serverRouter.middleware);
   */
  // middleware: $PropertyType<this, '_middleware'>;
  _middleware(req: IncomingMessage, res: ServerResponse, next: (error?: any) => void) {
    const {
      pathname,
      query
    } = url.parse(req.url, true);
    invariant(pathname, 'pathname is not falsy');
    invariant(query, 'query is not falsy');

    const context: ServerRouterContext = {
      req,
      res,
      userId: null
    };

    const decodedPath = decodeURIComponent(pathname);

    const responseReady = {};
    this._paths.reduce((promise, path: PathRegExp) => {
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

function getFieldValue(obj: Object | null | undefined, field: string): Object | null | undefined {
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
  }

  // eslint-disable-next-line no-param-reassign
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
