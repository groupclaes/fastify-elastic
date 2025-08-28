# Fastify-Elastic
A wrapper for using Fastify with Elastic

## Installation
```bash
npm i @groupclaes/fastify-elastic@5 --save
```


## Changes when migrating from  v4.x to v5.x
- Migration from Fastify v4 to Fastify v5
- Upgraded pino from v8 to v9
- Upgraded pose from v4 to v5
- When JWT is expired send 401 instead of 403
- Implemented ECS logging (if ECS is enabled it is applied to all pino transports!)
- It is now possible to have multiple pino transports aka (use elastic and logtail simultaneously)

## Changes when migrating from v3.x to v4.x
- Request logging is completely disabled by default
  - To enable set `requestLogging` to `true`
  - To enable fastify's default request logging set `disableRequestLogging` to `false` and unset or disable `requestLogging`
- Security Headers have been altered and additional security is now optional
  - Set `securityHeaders` to `false` to disable all security headers
  - Set `additionalSecurityHeaders` to `true` to enable additional security
- Plugins have been created for added functionality
  - default plugins always loaded include: 'healthcheck', 'reply-decorator', 'request-id'
  - extra optional standard plugins: 'cors', 'cookie'
  - optional custom plugins: 'jwt'


## Plugins
To enable additional plugins add them into the config and optionally provide plugin configuration
```javascript
module.exports = const config = {
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
This plugin adds a base route to the given prefix that returns an empty string as response (usefully for checking instance health)
```javascript
async function main(fastify) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}
```
### reply-decorator
This plugin adds 3 methods to the reply object: `success`, `fail` and `error` these return a response based on our base API response interface
```typescript
export interface IAPISuccessResponse<T> {
  status: 'success'
  code?: number // HTTP status code
  executionTime?: number // Optional: Execution time in milliseconds
  data?: T // Required if status is 'success' or 'fail', data should never be an array
}

export interface IAPIFailResponse {
  status: 'fail'
  code?: number // HTTP status code
  data?: any // Required if status is 'success' or 'fail', data should never be an array
  executionTime?: number // Optional: Execution time in milliseconds
}

export interface IAPIErrorResponse {
  status: 'error'
  code?: number // HTTP status code
  message: string // Required when status is 'error'
  executionTime?: number // Optional: Execution time in milliseconds
}

export type APIResult<T> = IAPISuccessResponse<T> | IAPIFailResponse | IAPIErrorResponse
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
import sql from 'mssql'
import { JWTPayload } from 'jose'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }

  export interface FastifyRequest {
    jwt: JWTPayload
    hasRole: (role: string) => boolean
    hasPermission: (permission: string, scope?: string) => boolean
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
