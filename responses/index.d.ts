import { FastifyReply } from 'fastify'

export function success(reply: FastifyReply, data?: any, code: number = 200, executionTime?: number): FastifyReply
export function fail(reply: FastifyReply, data: any, code: number = 400, executionTime?: number): FastifyReply
export function error(reply: FastifyReply, message: string, code: number = 500, executionTime?: number): FastifyReply
