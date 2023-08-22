import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'

export default async function fastify(config: IFastifyConfig): FastifyInstance { }

export module 'fastify' {
  export interface FastifyRequest {
    jwt?: JWTPayload
    hasRole?: (role: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number = 200, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number = 400, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number = 500, executionTime?: number) => FastifyReply 
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