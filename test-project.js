import fastify from './index.js'

async function start()  {
  const app = await fastify({
    serviceName: 'bobs-testshed',
    fastify: {
      disableRequestLogging: false,
      requestLogging: true,
      logger: {
        ecs: {
          containerized: true
        }
      }
    },
  })

  app.listen({ port: 8080 })
}

start()
