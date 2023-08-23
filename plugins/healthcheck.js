/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = function healthcheck(fastify, options, ßdone) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })

  done()
}