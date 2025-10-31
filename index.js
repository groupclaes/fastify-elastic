const Fastify = require('fastify')
const logging = require('./logging')

// local plugins
const { generate_request_id } = require('./plugins/request-id')

/**
 * 
 * @param {import('.').IFastifyConfig} appConfig 
 * @returns 
 */
module.exports = async function (appConfig) {
  const config = appConfig.fastify
  config.trustProxy = config.trustProxy || true
  config.disableRequestLogging = config.disableRequestLogging && true
  config.genReqId = generate_request_id
  config.requestIdHeader = 'x-request-id'


  let loggingConfig = config.logger

  // Use generic pino logger
  if (loggingConfig == null)
    loggingConfig = true
  else if (config.logger !== true) {
    loggingConfig = Object.assign({}, config.logger)
    delete config.logger

    config.loggerInstance = logging.setupLogging(appConfig, loggingConfig)
  }

  const fastify = Fastify(config)

  if (!config.disableRequestLogging) {
    fastify.log.info('requestLogging enabled, adding hooks; onRequest and onResponse to fastify Instance!')
    logging.setupRequestLogging(fastify, loggingConfig)
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
