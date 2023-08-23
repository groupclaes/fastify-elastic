/**
 * @param {import ('fastify').FastifyInstance} fastify 
 */
module.exports = function healthcheck(fastify, done) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
  
  done()
}