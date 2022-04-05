'use strict'

const maxRequestId = 3656158440062975n
let requestId = 0
const hostname = require('os').hostname()

function generateRequestId() {
  // Check if the request id has exceeded the max, exit process otherwise
  if (requestId >= maxRequestId) {
    this.server.log.error({ requestId }, 'Fastify server reached maxRequestId kill this instance!')
    process.exit(13)
  }

  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}

function setupLogging(elasticConfig, loggingConfig, serviceName) {
  elasticConfig['es-version'] = elasticConfig['es-version'] || 8
  elasticConfig.op_type = elasticConfig.op_type || 'create'
  elasticConfig.consistency = elasticConfig.consistency || 'one'

  if (elasticConfig.auth == null || elasticConfig.auth.username == null || elasticConfig.auth.password == null) {
    throw new Error('The elastic authentication isn\'t configurd correctly, please provide a username and a password')
  } else if (elasticConfig.auth.username.length < 2) {
    throw new Error('The elastic username is invalid')
  } else if (elasticConfig.auth.password.length < 5) {
    throw new Error('The elastic password isn\'t secure enough, no can do!')
  }

  if (loggingConfig) {
    loggingConfig.level = loggingConfig.level || 'info'
  }

  loggingConfig = {
    ...loggingConfig,
    base: {
      service: serviceName
    }
  }

  const streamToElastic = require('pino-elasticsearch')(elasticConfig)
  streamToElastic.on('insertError', (error) => console.log('ERROR', JSON.stringify(error, null, 6)))

  const logger = require('pino')(loggingConfig, streamToElastic)
  return logger
}

function addDefaultRequestHooks(fastify) {
  fastify.addHook('onRequest', (req, reply, done) => {
    if (!req.raw.url.includes('healthcheck')) {
      req.log.info({ url: req.raw.url }, 'Received request')
    }
    done()
  })

  fastify.addHook('onResponse', (req, reply, done) => {
    if (!req.raw.url.includes('healthcheck')) {
      req.log.info({
        url: req.raw.url,
        ip: req.ip,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime()
      }, 'Sent response')
    }
    done()
  })

  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('request-id', request.id)
    done()
  })

  fastify.route({ method: 'GET', url: '/healthcheck', handler: () => '' })
}

/**
 * Fastify wrapper class with basic setup and ease of use features
 *
 * @export
 * @class Fastify
 */
module.exports = class Fastify {
  authPreHandler

  config
  server
  serviceName

  constructor(config) {
    const fastify = require('fastify')

    this.config = config
    this.serviceName = config.serviceName

    const fastifyConfig = config.fastify
    if (fastifyConfig) {
      fastifyConfig.trustProxy = fastifyConfig.trustProxy || true,
        fastifyConfig.disableRequestLogging = fastifyConfig.disableRequestLogging || true

      if (fastifyConfig.logger == null) {
        // Default to logging true (stdout)
        fastifyConfig.logger = true
      } else if (fastifyConfig.logger !== true && config.elastic) {
        // If elastic is configured, use pine with pine-elasticsearch
        fastifyConfig.logger = setupLogging(
          config.elastic, fastifyConfig.logger, config.serviceName
        )
      }
    } else {
      throw new Error('No fastify configuration is specified, if desired set fastify to {}')
    }

    fastifyConfig.genReqId = generateRequestId

    this.server = fastify(fastifyConfig)

    addDefaultRequestHooks(this.server)

    if (config.cors != null) {
      this.addCors(config.cors)
    }
  }

  /**
   * Add cors with configuration
   * @param {Object} config 
   */
  addCors(config) {
    this.server.register(require('fastify-cors'), config || {})
  }

  /**
   * 
   * @param {Function} preHandler 
   */
  addAuthPreHandler(preHandler) {
    this.authPreHandler = preHandler
  }

  /**
   * Register a fastify route
   * @param {Object} route 
   */
  route(route, prepend = true) {
    if (prepend === true) {
      // prepend routes with process.env.APP_VERSION ie /v3
      route.url = `/${process.env.APP_VERSION ?? 'test'}/${this.serviceName}${route.url}`
    } else {
      route.url = `/${process.env.APP_VERSION ?? 'test'}${route.url}`
    }

    // Add extra check if requiredPermissions is set, Otherwise prehandler has no effect
    // An empty requiredPermissions array / value will only validate if the token is present and not expired
    if (this.authPreHandler && route.requiredPermissions) {
      // Check if handler return Promise
      if (returnsPromise(authPreHandler)) {
        route.preHandler = (request, reply) => this.authPreHandler(request, reply, route.requiredPermissions)
      } else {
        route.preHandler = (request, reply, done) => this.authPreHandler(request, reply, done, route.requiredPermissions)
      }
    }
    this.server.route(route)
  }

  /**
   * Register multiple fastify routes
   * @param {Array} routes 
   */
  routeMultiple(routes, prepend = true) {
    routes.forEach(x => this.route(x, prepend))
  }

  /**
   * Start the fastify server instance
   */
  async start() {
    try {
      await this.server.listen(this.config.port || 80, '::')
    } catch (error) {
      this.server.log.error({ error }, 'Fastify server died thowing an error')
      process.exit(1)
    }
  }
}

/*
  const config = {
    serviceName: string (REQUIRED)
    port: number | undefined
    fastify: {
      logging: boolean | object | undefined | null
    },
    elastic: {
      node: string | undefined,
      nodes: string[] | undefined,
      index: string | function returning string,
    },
    cors: {} // CORS config
  }

*/

// ✅ Promise check
function isPromise(p) {
  if (typeof p === 'object' && typeof p.then === 'function') {
    return true
  }
  return false
}

// ✅ Check if return value is promise
function returnsPromise(f) {
  if (
    f.constructor.name === 'AsyncFunction' ||
    (typeof f === 'function' && isPromise(f()))
  ) {
    // console.log('✅ Function returns promise')
    return true
  }

  // console.log('⛔️ Function does NOT return promise');
  return false
}
