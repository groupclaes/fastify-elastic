const fastifyPlugin = require('fastify-plugin')
const jose = require('jose')

module.exports = fastifyPlugin(jwt)

/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
async function jwt(fastify, opts) {
  fastify.decorateRequest('hasRole')
  fastify.decorateRequest('jwt')
  fastify.addHook('preHandler', handler)
}

/**
 * @param {import ('fastify').FastifyRequest} request 
 * @param {import ('fastify').FastifyReply} reply 
 */
async function handler(request, reply) {
  // add security headers to reply
  reply.header('X-Content-Type-Options', `nosniff`)
  reply.header('Referrer-Policy', `no-referrer`)
  reply.header('Permissions-Policy', `fullscreen=*`)
  reply.header('Strict-Transport-Security', `max-age=15552000; preload`)

  // handle authorization header if set
  if (request.headers.authorization) {
    const token = request.headers.authorization.substring(7)

    if (token) {
      const header = jose.decodeProtectedHeader(token)
      if (!header.jku)
        return reply.error('missing required jku in token header', 401)

      const JWKS = jose.createRemoteJWKSet(new URL(header.jku))
      const { payload } = await jose.jwtVerify(token, JWKS)

      request.jwt = payload
      request.hasRole = function (role) {
        if (payload['roles'] && Array.isArray(payload['roles']))
          return payload['roles'].includes(role)
        return false
      }

      if (payload?.sub)
        request.log = request.log.child({ user_id: payload.sub })
    }
  }
  return
}