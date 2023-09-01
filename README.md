# Fastify-Elastic
A wrapper for using Fastify with Elastic

## Installation
```bash
npm i @groupclaes/fastify-elastic@4 --save
```

## Changes when upgradeing from v3.x to v4.x
- Request logging is completely disabled by default
  - To enable set `requestLogging` to `true`
  - To enable fastify's default request logging set `disableRequestLogging` to `false` and unset or disable `requestLogging`
- Security Headers have been altered and additional security is now optional
  - Set `securityHeaders` to `false` to disable all security headers
  - Set `additionalSecurityHeaders` to `true` to enable additional security
- Plugins have been created for added functionality
  - default plugins always loaded include: 'healthcheck', 'reply-decorator', 'request-id'
  - extra optinal standard plugins: 'cors', 'cookie'
  - optional custom plugins: 'jwt'

## Plugins
To enable additional plugins add them into the config and optionally provide plugin configuration
```javascript
module.exports = const config {
  serviceName: 'products',
  fastify: {
    logger: {},
     // enable `additionalSecurityHeaders` fastify option
    additionalSecurityHeaders: true
  },
   // enable optional plugins
  jwt: {},
  cors: {},
  // enable optional plugin and pass configuration for that plugin
  cookie: {
    secret: 'my mother'
  }
}
``` 
### healthcheck
This plugin adds a base route to the given prefix that returns an empty string as response (usefull for checking instance health)
```javascript
async function (fastify) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}
```
### reply-decorator
This plugin adds 3 methods to the reply object: `success`, `fail` and `error` these return a response based on our base API response interface
```typescript
export interface IBaseApiResponse {
  status: 'error' | 'success' | 'fail'
  code: number // required
  message?: string // present if status is error
  data?: any // present if status is success or fail
  executionTime?: number // optional
}
```
### request-id
This plugin ads a header `request-id` with the current request id to the response
```typescript
async function (request, reply) {
  reply.header('request-id', request.id)
}
```


## Add the following declaration in controller files to enable access to decoratd variables/functions
```typescript
declare module 'fastify' {
  // these are only avilable when the plugin 'jwt' is loaded and a token is present, don't include them otherwise
  export interface FastifyRequest {
    jwt?: JWTPayload
    hasRole?: (role: string) => boolean
    hasPermission?: (permission: string, scope?: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}
```

# THIS DOCUMENTATION IS FOR v3 AND OLDER VERSIONS AND IS OUTDATED


## Usage
Example for creating a fastify-elastic instance and starting the server
```javascript
'use strict'

const Fastify = require('@groupclaes/fastify-elastic')

const main = async () => {
  const fastify = new Fastify({
    serviceName: 'hello-world',
    fastify: {
      logger: {}
    },
    cors: {},
    elastic: {
      index: 'index-name',
      node: 'https://es-server:9200',
      auth: {
        username: 'username',
        password: 'password'
      }
    }
  })
  fastify.routeMultiple([{
    method: 'GET',
    url: '/',
    handler: (req, reply) => { return 'Hello world!' },
    requiredPermissions: []
  }])
  await fastify.start()
}

main()
```

## Configuration
```javascript
const config = {
  serviceName: string
  port?: number
  fastify?: {
    logging?: boolean | object
  },
  elastic?: {
    node?: string,
    index: string,
    auth: {
      username: string,
      password: string
    }
  },
  cors?: object // CORS config
}
```

### templates
Default groupclaes index file `javascript with auth`
```javascript
'use strict'

const Fastify = require('@groupclaes/fastify-elastic')
const handle = require('@groupclaes/fastify-authhandler')
const config = require('./config')
const routes = require('./routes')

const main = async () => {
  const fastify = new Fastify(config.wrapper)
  fastify.addAuthPreHandler(handle)
  fastify.routeMultiple(routes)
  await fastify.start()
}

main()
```

Default groupclaes index file `typescript with auth`
```typescript
import Fastify from '@groupclaes/fastify-elastic'
import handle from '@groupclaes/fastify-authhandler'
import routes from './routes'

async function main() {
  const fastify = new Fastify(require('./config').wrapper)
  fastify.addAuthPreHandler(handle)
  fastify.routeMultiple(routes)
  await fastify.start()
}

main()
```