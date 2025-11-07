import { Logger } from 'pino';
import { IFastifyLoggerConfig } from './index.d';
import { FastifyInstance } from "fastify";

/**
 * Configure fastify for logging to stdout
 * 
 * @param fastify Fastify instance to setup all logging into
 * @param loggingConfig Configuration to apply all logs
 * @returns {Logger}
 */
export function setupLogging(fastify: FastifyInstance, loggingConfig: IFastifyLoggerConfig): Logger
/**
 * Enable custom http logging to the stdout
 * 
 * @param fastify Fastify instance to setup the request logging into
 * @param loggingConfig Configuration to apply to the request logs
 * @returns {void}
 */
export function setupRequestLogging(fastify: FastifyInstance, loggingConfig: IFastifyLoggerConfig): void