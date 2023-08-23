const hostname = require('os').hostname()

const maxRequestId = 3656158440062975n
let requestId = 0

/**
 * 
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = function request_id(fastify, options, done) {
  fastify.addHook('onSend', set_header)

  done()
}

/**
 * set request-id header
 * @param {import ('fastify').FastifyRequest} request 
 * @param {import ('fastify').FastifyReply} reply 
 * @param {function} done
 */
function set_header(request, reply, done) {
  reply.header('request-id', request.id)

  done()
}

module.exports.generate_request_id = function () {
  if (requestId >= maxRequestId)
    process.exit(13)
  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}