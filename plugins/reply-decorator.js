/**
 * 
 * @param {import ('fastify').FastifyInstance} fastify 
 */
export default async function (fastify) {
  fastify.decorateReply('success')
  fastify.decorateReply('fail')
  fastify.decorateReply('error')

  fastify.addHook('onRequest', async function (request, reply) {
    reply.success = success
    reply.fail = fail
    reply.error = error
  })
}

/**
 * Return a sucessful response
 * @param {any | undefined} data
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {import ('fastify').FastifyReply} if data is not defined return 204 response
 */
async function success(data, code = 200, executionTime = undefined) {
  if (!data)
    return this
      .code(204)
      .send(undefined)

  return this
    .code(code)
    .send({
      status: 'success',
      code,
      data,
      executionTime
    })
}

/**
 * Return a failed response
 * @param {any | null} data
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {import ('fastify').FastifyReply}
 */
async function fail(data, code = 400, executionTime = undefined) {
  return this
    .code(code)
    .send({
      status: 'fail',
      code,
      data,
      executionTime
    })
}

/**
 * Return a error response
 * @param {string} message
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {import ('fastify').FastifyReply}
 */
async function error(message, code = 500, executionTime = undefined) {
  return this
    .code(code)
    .send({
      status: 'error',
      code,
      message,
      executionTime
    })
}