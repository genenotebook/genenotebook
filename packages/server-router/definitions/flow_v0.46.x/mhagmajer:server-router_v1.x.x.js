/* @flow */

declare module 'meteor/mhagmajer:server-router' {
  declare type Path = {|
    path: string,
    options?: {|
      sensitive?: boolean,
      strict?: boolean,
      end?: boolean,
      delimiter?: string,
    |},
    args: ArgsMapper,
    route: Route,
  |};

  declare type ArgsMapper = (
    params: { [key: string]: string | Array<string> },
    query: { [key: string]: string }
  ) => Array<any>;

  declare type Route = (...args: Array<any>) => Promise<void | boolean>;

  declare type Routes = { [name: string]: Route | Routes }

  declare export type ServerRouterContext = {
    req: http$IncomingMessage,
    res: http$ServerResponse,
    userId: ?string,
  };

  declare type Middleware = (req: http$IncomingMessage, res: http$ServerResponse, next: (error?: any) => void) => void;

  declare type ServerRouterOptions = {|
    routes?: Routes,
    defaultRoutePath?: string,
    paths?: Array<Path>,
  |};

  declare export class ServerRouter {
    static middleware(options?: ServerRouterOptions): Middleware;

    constructor(options?: ServerRouterOptions): this;

    addPath(data: Path): void;
    addPaths(data: Array<Path>): void;
    addRoutes(routes: Routes): void;
    middleware: Middleware;
  }

  declare export class AuthenticationRequiredError {
  }

  declare export class ServerRouterClient<R: Routes> {
    constructor(options?: {|
      routes?: R,
      defaultRoutePath?: string,
    |}): this;

    redirect: R;
    path: R;

    redirectTo(path: string): Promise<void>;
    redirectToRoute(name: string, ...args: Array<any>): Promise<void>;
    authenticatePath(path: string): Promise<string>;
    getRoutePath(name: string, ...args: Array<any>): string;
  }
}
