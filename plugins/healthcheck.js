/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = async function healthcheck(fastify) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}