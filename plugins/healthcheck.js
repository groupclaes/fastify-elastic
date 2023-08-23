/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = async function (fastify, opts) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}