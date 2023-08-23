const hostname = require('os').hostname()
const fastifyPlugin = require('fastify-plugin')

const maxRequestId = 3656158440062975n
let requestId = 0

module.exports = fastifyPlugin(request_id)

/**
 * 
 * @param {import ('fastify').FastifyInstance} fastify 
 */
async function request_id(fastify) {
  fastify.addHook('onSend', set_header)
  fastify.log.debug('adding plugin request_id')
}

/**
 * set request-id header
 * @param {import ('fastify').FastifyRequest} request 
 * @param {import ('fastify').FastifyReply} reply 
 * @param {function} done
 */
async function set_header(request, reply) {
  reply.header('request-id', request.id)
}

module.exports.generate_request_id = function () {
  if (requestId >= maxRequestId)
    process.exit(13)
  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}