import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { hostname } from 'os'

const maxRequestId = 3656158440062975n
let requestId = 0

/**
 * 
 * @param {FastifyInstance} fastify 
 */
export default function request_id(fastify) {
  fastify.options['genReqId'] = generate_request_id
  fastify.addHook('onSend', set_header)
}

/**
 * set request-id header
 * @param {FastifyRequest} request 
 * @param {FastifyReply} reply 
 */
async function set_header (request, reply) {
  reply.header('request-id', request.id)
}

function generate_request_id() {
  if (requestId >= maxRequestId)
    process.exit(13)
  return hostname() + ('0000000000' + (++requestId).toString(36)).slice(-10)
}