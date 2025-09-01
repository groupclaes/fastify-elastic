const Fastify = require('fastify')
const pino = require('pino')

const { env } = require('process')

// local plugins
const { generate_request_id } = require('./plugins/request-id')

/**
 * create logger instance using pino
 * @param {any} elasticConfig elasticsearch config
 * @param {any} loggingConfig general logger config
 * @param {string} serviceName
 * @returns
 */
function setupElasticLogging(elasticConfig, loggingConfig, serviceName) {
  elasticConfig.esVersion = elasticConfig['es-version'] ?? 8
  elasticConfig.op_type = elasticConfig.op_type ?? 'create'
  elasticConfig.consistency = elasticConfig.consistency ?? 'one'

  if (elasticConfig.auth == null || elasticConfig.auth.username == null || elasticConfig.auth.password == null) {
    throw new Error('The elastic authentication isn\'t configured correctly, please provide a username and a password')
  } else if (elasticConfig.auth.username.length < 2) {
    throw new Error('The elastic username is invalid')
  } else if (elasticConfig.auth.password.length < 5) {
    throw new Error('The elastic password isn\'t secure enough, no can do!')
  }

  return {
    level: loggingConfig.level ?? 'info',
    target: 'pino-elasticsearch',
    options: {
      ...elasticConfig,
      base: {
        service: {
          name: serviceName,
          version: env['APP_VERSION'] ?? 'test'
        }
      }
    }
  }
}

function setupLogtailLogging(logtailConfig, loggingConfig, serviceName) {
  return {
    level: loggingConfig.level ?? 'info',
    target: '@logtail/pino',
    options: {
      ...loggingConfig,
      sourceToken: logtailConfig.token,
      base: {
        service: {
          name: serviceName,
          version: env['APP_VERSION'] ?? 'test'
        }
      }
    }
  }
}

function setupEcsLogging(config, serviceName) {
  const { ecsFormat } = require('@elastic/ecs-pino-format')
  let ecsConfig = { apmIntegration: false, serviceName }
  if (env['APP_VERSION']) {
    ecsConfig.serviceVersion = env['APP_VERSION']
  }
  if (env['NODE_ENV']) {
    ecsConfig.env = env['NODE_ENV']
  }
  return ecsFormat(ecsConfig)
}

function setupLogging(appConfig, loggingConfig) {
  const loggingTargets = []
  let options = {}

  if (appConfig.ecs) {
    options = setupEcsLogging(loggingConfig, appConfig.serviceName)
    loggingTargets.push({ level: loggingConfig.level ?? 'info', target: 'pino/file' })
    loggingTargets.push({ level: 'trace', target: 'pino/file', options: { destination: 1 } })
  }
  // If elastic is configured, use pino with pino-elasticsearch
  if (appConfig.elastic) {
    loggingTargets.push(setupElasticLogging(appConfig.elastic, loggingConfig, appConfig.serviceName))
  }
  // If Logtail is configured, use pino with @logtail/pino
  if (appConfig.logtail) {
    loggingTargets.push(setupLogtailLogging(appConfig.logtail, loggingConfig, appConfig.serviceName))
  }

  return pino({
    level: loggingConfig.level ?? 'info',
    ...options
  }, pino.transport({
    targets: loggingTargets
  }))
}

module.exports = async function (appConfig) {
  const config = appConfig.fastify
  config.trustProxy = config.trustProxy || true
  config.disableRequestLogging = config.disableRequestLogging || true

  // default logger
  if (config.logger == null)
    config.logger = true
  else if (config.logger !== true) {
    console.log('set instance')
    config.loggerIntance = setupLogging(appConfig, config.logger)
    console.log('delete logger key')
    config.logger = true
  }
  config.genReqId = generate_request_id

  const fastify = Fastify(config)

  if (config.requestLogging) {
    // hooks
    fastify.addHook('onRequest', async function (request, reply) {
      if (!request.raw.url.includes('healthcheck'))
        request.log.info({ url: request.raw.url }, 'Received request')
    })
    fastify.addHook('onResponse', async function (request, reply) {
      if (!request.raw.url.includes('healthcheck'))
        request.log.info({
          url: request.raw.url,
          ip: request.ip,
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime
        }, 'Sent response')
    })
  }

  // https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
  if (config.securityHeaders)
    fastify.addHook('onSend', async function (request, reply) {
      // To prevent browsers from performing MIME sniffing, and inappropriately interpreting responses as HTML.
      reply.header('X-Content-Type-Options', `nosniff`)
      // To protect against drag-and-drop style clickjacking attacks.
      reply.header('X-Frame-Options', `DENY`)
      // To require connections over HTTPS and to protect against spoofed certificates.
      reply.header('Strict-Transport-Security', `max-age=15552000; preload`)
      // To protect against drag-and-drop style clickjacking attacks.
      reply.header('Content-Security-Policy', config.securityHeaders.csp ?? `frame-ancestors 'none'`)
      /**
       * The headers below are only intended to provide additional security when responses are rendered as HTML. As such, if the API will never return HTML in responses, then these headers may not be necessary. However, if there is any uncertainty about the function of the headers, or the types of information that the API returns (or may return in future), then it is recommended to include them as part of a defence-in-depth approach.
       */
      if (config.additionalSecurityHeaders) {
        // Non-HTML responses should not trigger additional requests.
        reply.header('Referrer-Policy', `no-referrer`)
        // This header used to be named Feature-Policy. When browsers heed this header, it is used to control browser features via directives. The example disables features with an empty allowlist for a number of permitted directive names. When you apply this header, verify that the directives are up-to-date and fit your needs. Please have a look at this article for a detailed explanation on how to control browser features.
        reply.header('Permissions-Policy', `fullscreen=*`)
        // The majority of CSP functionality only affects pages rendered as HTML.
        reply.header('Content-Security-Policy', config.securityHeaders.csp ?? `default-src 'none'`)
      }
    })

  // required custom plugins
  await fastify.register(require('./plugins/reply-decorator'), { name: 'reply-decorator' })
  await fastify.register(require('./plugins/request-id'), { name: 'request-id' })
  await fastify.register(require('./plugins/healthcheck'), { prefix: 'healthcheck', name: 'healthcheck' })

  // optional core plugins
  if (appConfig.cors)
    await fastify.register(require('@fastify/cors'), appConfig.cors || {})

  if (appConfig.cookie)
    await fastify.register(require('@fastify/cookie'), appConfig.cookie || {})

  // optional custom plugins
  if (appConfig.jwt)
    await fastify.register(require('./plugins/jwt'), appConfig.jwt || { name: 'jwt' })

  if (appConfig.mssql)
    await fastify.register(require('./plugins/mssql'), appConfig.mssql)

  return fastify
}
