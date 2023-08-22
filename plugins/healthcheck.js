import { FastifyInstance } from 'fastify'

/**
 * @param {FastifyInstance} fastify 
 */
export default async function healthcheck(fastify) {
  fastify.route({ method: 'GET', url: '/', handler: async () => '' })
}