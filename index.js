import Fastify from 'fastify'


import fastifyCors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import pinoElasticSearch from 'pino-elasticsearch'
import pino from 'pino'

// local plugins
import request_id from './plugins/request-id'
import healthcheck from './plugins/healthcheck'
import replyDecorator from './plugins/reply-decorator'
import jwt from './plugins/jwt'

/**
 * create logger instance using pino
 * @param {any} elasticConfig elasticsearch config
 * @param {any} loggingConfig general logger config
 * @param {string} serviceName
 * @returns 
 */
function setupLogging(elasticConfig, loggingConfig, serviceName) {
  elasticConfig['es-version'] = elasticConfig['es-version'] || 8
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

  const streamToElastic = pinoElasticSearch(elasticConfig)
  streamToElastic.on('error', (error) => console.error('Elasticsearch client error:', error))
  streamToElastic.on('insertError', (error) => console.log('ERROR', JSON.stringify(error, null, 6)))

  return pino(loggingConfig, streamToElastic)
}

export default async function (appConfig) {
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
    fastify.register(fastifyCors, appConfig.cors || {})

  if (appConfig.cookie)
    fastify.register(fastifyCookie, appConfig.cookie || {})

  // optional custom plugins
  if (appConfig.jwt)
    fastify.register(jwt)

  return fastify
}