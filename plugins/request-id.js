const fastifyPlugin = require('fastify-plugin')

const hostname = require('os').hostname()
const maxRequestId = 3656158440062975n
let requestId = 0


/**
 *
 * @param {import ('fastify').FastifyInstance} fastify
 */
async function request_id(fastify) {
  fastify.log.debug('adding plugin request_id')

  fastify.addHook('onResponse', setHeader)
}

/**
 * set request-id header
 * @param {import ('fastify').FastifyRequest} request
 * @param {import ('fastify').FastifyReply} reply
 * @param {function} done
 */
async function setHeader(request, reply) {
  reply.header('x-request-id', request.id)
}

module.exports = fastifyPlugin(request_id)
module.exports.generate_request_id = function (req, _) {
  const requestIdHeader = req.headers['x-request-id']
  if (requestIdHeader)
    return requestIdHeader
  else if (requestId >= maxRequestId)
    process.exit(13)

  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}
