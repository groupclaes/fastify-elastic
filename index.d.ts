import { FastifyInstance } from 'fastify'
import { JWTPayload } from 'jose'

export default function fastify(config: IFastifyConfig): Promise<FastifyInstance>

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