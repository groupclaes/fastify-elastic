# Fastify-Elastic
A wrapper for using Fastify with Elastic

# THIS DOCUMENTATION IS FOR v3 AND IS OUTDATED

## Installation
```bash
npm i @groupclaes/fastify-elastic
```

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