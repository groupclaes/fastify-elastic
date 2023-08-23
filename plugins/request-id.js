const hostname = require('os').hostname()

const maxRequestId = 3656158440062975n
let requestId = 0

/**
 * 
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = async function request_id(fastify) {
  fastify.addHook('onSend', set_header)
}

/**
 * set request-id header
 * @param {import ('fastify').FastifyRequest} request 
 * @param {import ('fastify').FastifyReply} reply 
 */
async function set_header(request, reply) {
  reply.header('request-id', request.id)
}

module.exports.generate_request_id = function () {
  if (requestId >= maxRequestId)
    process.exit(13)
  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}