import { FastifyInstance } from 'fastify'

export default function fastify(config: IFastifyConfig): Promise<FastifyInstance>

export interface IFastifyConfig {
  serviceName: string
  port?: number
  fastify?: {
    logger?: boolean | object,
    requestLogging?: boolean,
    disableRequestLogging?: boolean,
    securityHeaders?: boolean,
    additionalSecurityHeaders?: boolean
  },
  elastic?: {
    node?: string,
    index: string,
    auth: {
      username: string,
      password: string
    }
  },
  ecs?: any,
  logtail?: {
    token: string
  }
  cors: any
}
