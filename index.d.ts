import { FastifyInstance } from 'fastify'

declare class Fastify {
  authPreHandler: Function

  config: any
  server: FastifyInstance
  serviceName: string

  constructor(config: any): void

  addCors(config: any): void
  addAuthPreHandler(handler: Function, decorateVariables?: string | string[] = 'token'): void

  /**
   * Register a fastify route
   * @param {Object} route 
   * @param {boolean} [prepend=true] if true prepend routes with serviceName
   */
  route(route: any, prepend: boolean = true): void
  routeMultiple(routes: any[], boolean = true)
}