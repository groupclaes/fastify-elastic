const fastifyPlugin = require('fastify-plugin')
const jose = require('jose')
const { env } = require('process')

module.exports = fastifyPlugin(jwt)
module.exports.handler = handler

/**
 * @param {import ('fastify').FastifyInstance} fastify
 */
async function jwt(fastify) {
  fastify.decorateRequest('hasRole')
  fastify.decorateRequest('hasPermission')
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
        request.hasRole = hasRole
        // permission: 'read', 'write', 'read_all'
        request.hasPermission = hasPermission

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

function hasRole(role) {
  if (this.jwt['roles'] && Array.isArray(this.jwt['roles']))
    return this.jwt['roles'].includes(role)
  return false
}

function hasPermission(permssion, scope = undefined) {
  // if no scope is defined we shall use any * value for the current app
  if (!scope)
    scope = env['SCOPE']

  if (!this.jwt['roles'] || !Array.isArray(this.jwt['roles']))
    return false

  // get all roles for current app scope, be sure to take only first part from scope
  const roles = this.jwt['roles']
    .filter(x => x.split(':')[1].startsWith(env['SCOPE'].split('/')[0]))

  return roles.some(x => {
    const parts = x.split(':')
    const role = parts[0]
    const scopes = parts[1].split('/')

    const reqScopes = scope.split('/')
    if (permissions[role].some((perm) => perm == permssion)) {
      for (let i = 0; i < reqScopes.length; i++) {
        if (i === 0 && scopes[i] === reqScopes[i]) continue
        else if (greaterThanZero(i) && scopes[i] === reqScopes[i] && i + 1 !== reqScopes.length) continue
        else if (greaterThanZero(i) && ((scopes[i] === reqScopes[i] && i + 1 === reqScopes.length) || scopes[i] === '*')) return true
      }
    }
    return false
  })
}

function greaterThanZero(number) { return number > 0 }

// fixed permissions per role
const permissions = {
  'admin': [
    'read_all',
    'read',
    'write_all',
    'write',
    'delete_all',
    'delete',
  ],
  'moderator': [
    'read_all',
    'read',
    'write_all',
    'write',
    'delete',
  ],
  'contributor': [
    'read_all',
    'read',
    'write',
    'delete',
  ],
  'user': [
    'read',
    'write',
  ],
  'guest': [
    'read',
  ]
}