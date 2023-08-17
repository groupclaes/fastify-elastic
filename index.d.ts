import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

declare class Fastify {
  authPreHandler: Function

  config: any
  server: FastifyInstance
  serviceName: string

  constructor(config: IFastifyConfig)

  addCors(config: any): void

  /**
   * Add authentication handle [@groupclaes/fastify-authhandler]
   * @param decorateVariables, defaults to 'token'
   */
  addAuthPreHandler(handler: Function, decorateVariables?: string | string[]): void

  /**
   * Register a fastify route
   * @param prepend, defaults to true if true prepend routes with serviceName
   */
  route(route: IFastifyRoute, prepend: boolean): void

  /**
   * Register fastify routes
   * @param prepend, defaults to true if true prepend routes with serviceName
   */
  routeMultiple(routes: IFastifyRoute[], prepend: boolean): void

  /**
   * Start fastify instance
   */
  start(): void
}

export type HTTPMethods = LooseAutocomplete<'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD'>
type LooseAutocomplete<T extends string> = T | Omit<string, T>

/**
 * @param {'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD'} method
 * @param {string} url
 * @param {(req: FastifyRequest, reply: FastifyReply) => Promise<void>} handler
 * @param {string | string[]} requiredPermissions used by [@groupclaes/fastify-authhandler]
 */
export interface IFastifyRoute {
  method: HTTPMethods,
  url: string,
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>,
  requiredPermissions?: string | string[]
}

export interface IFastifyConfig {
  serviceName: string
  port?: number
  fastify?: {
    logging?: boolean | object
  },
  elastic?: {
    node?: string,
    index: string,
    auth: {
      username: string,
      password: string
    }
  },
  cors: any
}