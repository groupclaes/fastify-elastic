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
  fastify.log.debug('adding plugin request_id')

  fastify.addHook('onRequest', set_header)
}

/**
 * set request-id header
 * @param {import ('fastify').FastifyRequest} request
 * @param {import ('fastify').FastifyReply} reply
 * @param {function} done
 */
async function set_header(request, reply) {
  let reqId = generateRequestId()
  reply.header('request-id', reqId)
  request.log = request.log.child({ http: { request: { id: reqId } } })
}

function generateRequestId() {
  if (requestId >= maxRequestId)
    process.exit(13)
  return hostname + ('0000000000' + (++requestId).toString(36)).slice(-10)
}

module.exports.generate_request_id = generateRequestId
