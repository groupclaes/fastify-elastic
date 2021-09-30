'use strict'

import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import pino from 'pino'
import pinoElastic from 'pino-elasticsearch'

const maxRequestId = 9223372036854775807n

let requestId = 0
let prefixZeroes = '000000000'

function generateRequestId() {
  if (requestId >= maxRequestId) {
    requestId = 1
  }

  let reqId = prefixZeroes + (++requestId).toString(36)
  if (reqId.length > 10) {
    reqId = reqId.substr(1)
    prefixZeroes = prefixZeroes.slice(0, -1)
  }

  return reqId
}

function setupLogging(elasticConfig, loggingConfig) {
  elasticConfig['es-version'] = elasticConfig['es-version'] || 7
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

  const streamToElastic = pinoElastic(elasticConfig)
  streamToElastic.on('insertError', (error) => console.log('ERROR', JSON.stringify(error, null, 6)))

  const logger = pino(loggingConfig, streamToElastic)
  return logger
}

function addDefaultRequestHooks(fastify) {
  fastify.addHook('onRequest', (req, _, done) => {
    if (!req.raw.url.includes('healthcheck')) {
      req.log.info({ url: req.raw.url }, 'Received request')
    }
    done()
  })
  
  fastify.addHook('onResponse', (req, reply, done) => {
    if (!req.raw.url.includes('healthcheck')) {
      req.log.info({ url: req.raw.url, ip: req.ip, statusCode: reply.statusCode, responseTime: reply.getResponseTime() }, 'Sent response')
    }
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
export class Fastify {
  authPreHandler

  server
  serviceName

  constructor(config) {
    this.serviceName = config.serviceName

    const fastifyConfig = config.fastify
    if (fastifyConfig) {
      fastifyConfig.trustProxy = fastifyConfig.trustProxy || true,
      fastifyConfig.disableRequestLogging = fastifyConfig.disableRequestLogging || true
  
      if (fastifyConfig.logger == null) {
        fastifyConfig.logger = true // Default to logging true (stdout)
      } else if (fastifyConfig.logger !== true && config.elastic) {
        fastifyConfig.logger = setupLogging(config.elastic, fastifyConfig.logger) // If elastic is configured, use pine with pine-elasticsearch
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
    this.server.register(fastifyCors, config || {})
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
  route(route) {
    
    // prepend routes with process.env.APP_VERSION ie /v3
    route.url = `/${process.env.APP_VERSION ?? 'test'}/${this.serviceName}/${route.url}`

    route.preHandler = (request, reply) => this.authPreHandler(request, reply, route.requiredPermission)
    this.server.route(route)
  }
  /**
   * Register multiple fastify routes
   * @param {Array} routes 
   */
  routeMultiple(routes) {
    routes.forEach(x => this.route(x))
  }

  /**
   * Start the fastify server instance
   */
  async start() {
    try {
      await this.server.listen(4002, '::')
    } catch (error) {
      this.server.log.error({ error }, 'Fastify server died thowing an error')
      process.exit(1)
    }
  }
}

/*
  const config = {
    serviceName: string (REQUIRED)
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
