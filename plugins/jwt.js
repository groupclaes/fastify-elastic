const fastifyPlugin = require('fastify-plugin')
const jose = require('jose')

module.exports = fastifyPlugin(jwt)
module.exports.handler = handler

/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
async function jwt(fastify) {
  fastify.decorateRequest('hasRole')
  fastify.decorateRequest('jwt')
  fastify.addHook('preHandler', handler)
}

/**
 * @param {import ('fastify').FastifyRequest} request 
 * @param {import ('fastify').FastifyReply} reply 
 */
async function handler(request, reply) {
  // handle authorization header if set
  if (request.headers.authorization) {
    const token = request.headers.authorization.substring(7)

    if (token) {
      const header = jose.decodeProtectedHeader(token)
      if (!header.jku)
        return reply.error('missing required jku in token header', 401)

      try {
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
      } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED')
          return reply.error(err.message, 401)
        return reply.error(err?.message ?? 'unknown error while reading jwt', 403)
      }
    }
  }
  return
}