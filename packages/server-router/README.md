# mhagmajer:server-router
Server router with authentication for Meteor

Introductory blog post:
[https://blog.hagmajer.com/server-side-routing-with-authentication-in-meteor-6625ed832a94](https://blog.hagmajer.com/server-side-routing-with-authentication-in-meteor-6625ed832a94).

Documentation: [https://mhagmajer.github.io/server-router/](https://mhagmajer.github.io/server-router/).

# Compatibility

Please beware that:
* versions 1.2.x and above require Meteor 1.6.1+
* versions 1.1.x and below require Meteor 1.4.4.2-1.6

# Installing

`meteor add mhagmajer:server-router`

You can find Flow type definitions in `/definitions`.

# Example

## Server-side

```js
import { ServerRouter } from 'meteor/mhagmajer:server-router';

WebApp.connectHandlers.use(ServerRouter.middleware({
  paths: [],
  routes: {
    hello(name) {
      this.res.end(`You ${name}, your id is ${this.userId}`);
    },
  },
}));
```

## Client-side

```js
import { ServerRouterClient } from 'meteor/mhagmajer:server-router';

const serverRouterClient = new ServerRouterClient({
  routes: {
    hello: 1,
  },
});

<Button onClick={() => {
  serverRouterClient.redirect.hello('John');  
}} />
```

# Publishing (contributors)

Run `npm run clean` before `meteor publish`.
