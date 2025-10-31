import pino from 'pino'
import os from 'os'
import process from 'node:process'

const hostname = os.hostname().toLowerCase()

/**
 * 
 * @param {import('.').IFastifyConfig} appConfig 
 * @param {import('.').IFastifyLoggerConfig} loggingConfig 
 * @returns 
 */
function setupLogging(appConfig, loggingConfig) {
  const level = loggingConfig.level ?? process.env['APP_LOGLEVEL'] ?? 'info'
  if (loggingConfig.ecs) {
    appConfig.fastify.requestIdLogLabel = 'http.request.id'

    return pino({
      level,
      timestamp: () => `,"@timestamp":"${new Date(Date.now()).toISOString()}"`,
      formatters: {
        bindings: () => {
          const baseFields = {
            process: {
              pid: process.pid,
            },
            service: {
              name: appConfig.serviceName,
              version: process.env['APP_VERSION'],
              environment: process.env['NODE_ENV']
            },
            node_version: process.version
          }
          // Fields will be set by the orchastrator logger as it has more details & privileges
          if (!loggingConfig.ecs.containerized) {
            baseFields['host'] = {
              hostname,
              architecture: process.arch,
              uptime: loggingConfig.showUptime ? os.uptime() : undefined
            }
          }

          return baseFields
        },
        level: (label) => ({ log: { level: label } })
      },
      redact: {
        paths: [
          'user.password', 'password', 'user.phone', 'user.mobilePhone', 'user.mobile',
          'http.request.headers.bearer',
          'url.password'
        ],
        remove: false
      },
      messageKey: 'message'
    })
  } else {
    return pino({
      level,
      formatters: {
        bindings: () => ({
          procId: process.id,
          service: appConfig.serviceName,
          serviceVersion: process.env['APP_VERSION'],
          env: process.env['NODE_ENV'],
          nodeVersion: process.version,
          hostname,
          arch: process.arch,
          uptime: loggingConfig.showUptime ? os.uptime() : undefined
        }),
        level: (label) => ({ level: label })
      },
    })
  }
}

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
function setupECSRequestLogging(fastify) {
  // Making a sync function async would reduce performance
  fastify.addHook('onRequest', function (request, _, done) {
    request.log.info({
      event: {
        category: [ 'api', 'web' ],
        type: [ 'info', 'start' ],
        outcome: 'succeeded',
        start: new Date().toISOString()
      },
      url: {
        original: request.originalUrl
      },
      client: {
        ip: request.ip
      },
      user_agent: { original: request.headers['user-agent'] },
      http: {
        version: request.raw.httpVersion,
        request: {
          id: request.id,
          method: request.method,
          referrer: request.headers['referer'],
          headers: request.headers,
          body: { bytes: +request.headers['content-length'] }
        }
      }
    }, 'Received request')

    done()
  })

  fastify.addHook('onResponse', function (request, reply, done) {
    request.log.info({
      event: {
        category: [ 'api', 'web' ],
        type: [ 'info', 'end' ],
        outcome: reply.statusCode < 400,
        duration: reply.elapsedTime,
        end: new Date().toISOString()
      },
      url: {
        full: request.raw.url,
        original: request.originalUrl
      },
      client: {
        ip: request.ip
      },
      user_agent: { original: request.headers['user-agent'] },
      http: {
        version: request.raw.httpVersion,
        request: {
          id: request.id,
          method: request.method,
          referrer: request.headers['referer'],
          headers: request.headers
        },
        response: {
          status_code: reply.statusCode,
          headers: reply.getHeaders(),
          body: { bytes: +reply.getHeader('content-length') }
        }
      }
    }, 'Sent response')

    done()
  })
}

/**
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 */
function setupNormalRequestLogging(fastify) {
  // Making a sync function async would reduce performance
  fastify.addHook('onRequest', function (request, _, done) {
    request.log.info({
      url: request.originalUrl,
      clientIp: request.ip,
      user_agent: request.headers['user-agent'],
      version: request.raw.httpVersion,
      method: request.method,
      referrer: request.headers['referer'],
      bodyLength: +request.headers['content-length'],
      headers: request.headers
    }, 'Received request')

    done()
  })

  fastify.addHook('onResponse', function (request, reply, done) {
    request.log.info({
      url: request.originalUrl,
      clientIp: request.ip,
      user_agent: request.headers['user-agent'],
      version: request.raw.httpVersion,
      method: request.method,
      statusCode: reply.statusCode,
      referrer: request.headers['referer'],
      bodyLength: +reply.getHeader('content-length'),
      headers: reply.getHeaders()
    }, 'Sent response')

    done()
  })
}

/**
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {import('.').IFastifyLoggerConfig} loggingConfig 
 */
function setupRequestLogging(fastify, loggingConfig) {
  if (loggingConfig.ecs) {
    setupECSRequestLogging(fastify)
  } else {
    setupNormalRequestLogging(fastify)
  }
}


export {
  setupLogging,
  setupRequestLogging
}
