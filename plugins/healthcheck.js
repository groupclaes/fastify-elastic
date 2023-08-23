/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = async function (fastify) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}