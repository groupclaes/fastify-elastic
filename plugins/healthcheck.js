/**
 * @param {import ('fastify').FastifyInstance} fastify
 */
module.exports = async function (fastify) {
  fastify.log.debug('adding plugin healthcheck')

  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}
