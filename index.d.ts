import { FastifyInstance } from 'fastify'
import { JWTPayload } from 'jose'

export default function fastify(config: IFastifyConfig): Promise<FastifyInstance>

export module 'fastify' {
  export interface FastifyRequest {
    jwt?: JWTPayload
    hasRole?: (role: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
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