const Fastify = require('fastify')

// local plugins
const request_id = require('./plugins/request-id')
const healthcheck = require('./plugins/healthcheck')
const replyDecorator = require('./plugins/reply-decorator')
const jwt = require('./plugins/jwt')

/**
 * create logger instance using pino
 * @param {any} elasticConfig elasticsearch config
 * @param {any} loggingConfig general logger config
 * @param {string} serviceName
 * @returns 
 */
function setupLogging(elasticConfig, loggingConfig, serviceName) {
  elasticConfig.esVersion = elasticConfig['es-version'] || 8
  elasticConfig.op_type = elasticConfig.op_type || 'create'
  elasticConfig.consistency = elasticConfig.consistency || 'one'

  if (elasticConfig.auth == null || elasticConfig.auth.username == null || elasticConfig.auth.password == null)
    throw new Error('The elastic authentication isn\'t configurd correctly, please provide a username and a password')
  else if (elasticConfig.auth.username.length < 2)
    throw new Error('The elastic username is invalid')
  else if (elasticConfig.auth.password.length < 5)
    throw new Error('The elastic password isn\'t secure enough, no can do!')

  if (loggingConfig)
    loggingConfig.level = loggingConfig.level || 'info'

  loggingConfig = {
    ...loggingConfig,
    base: {
      service: serviceName
    }
  }

  const streamToElastic = require('pino-elasticsearch')(elasticConfig)
  streamToElastic.on('error', (error) => console.error('Elasticsearch client error:', error))
  streamToElastic.on('insertError', (error) => console.log('ERROR', JSON.stringify(error, null, 6)))

  return require('pino')(loggingConfig, streamToElastic)
}

module.exports = function (appConfig) {
  const config = appConfig.fastify
  config.trustProxy = config.trustProxy || true
  config.disableRequestLogging = config.disableRequestLogging || true

  // defatult logger
  if (config.logger == null)
    config.logger = true
  else if (config.logger !== true && appConfig.elastic)
    // If elastic is configured, use pine with pine-elasticsearch
    config.logger = setupLogging(appConfig.elastic, config.logger, appConfig.serviceName)

  const fastify = Fastify(config)
  // required custom plugins
  fastify.register(replyDecorator)
  fastify.register(request_id)
  fastify.register(healthcheck, { prefix: 'healthcheck' })

  // hooks
  fastify.addHook('onRequest', async function (req, reply) {
    if (!req.raw.url.includes('healthcheck'))
      req.log.info({ url: req.raw.url }, 'Received request')
  })
  fastify.addHook('onResponse', async function (req, reply) {
    if (!req.raw.url.includes('healthcheck'))
      req.log.info({
        url: req.raw.url,
        ip: req.ip,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime()
      }, 'Sent response')
  })

  // optional core plugins
  if (appConfig.cors)
    fastify.register(require('@fastify/cors'), appConfig.cors || {})

  if (appConfig.cookie)
    fastify.register(require('@fastify/cookie'), appConfig.cookie || {})

  // optional custom plugins
  if (appConfig.jwt)
    fastify.register(jwt)

  return fastify
}