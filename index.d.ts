import { ISitemapOptions } from './plugins/sitemap.d';
import { FastifyInstance } from 'fastify'

export interface IFastifyAppConfig {
  logger?: boolean | IFastifyLoggerConfig,
  disableRequestLogging?: boolean,
  /**
   * @deprecated
   */
  securityHeaders?: boolean,
  additionalSecurityHeaders?: boolean
}

export interface IFastifyLoggerConfig {
  level?: string | 'info',
  /**
   * Show the host uptime.
   * @requires containerized to be set false when using ECS
   */
  showUptime?: boolean
  ecs?: {
    /**
     * Specify if running in a container (default true)
     * @default true
     */
    containerized?: boolean,
    /**
     * 
     * @default string[] user.password password user.phone user.mobilePhone user.mobile
          http.request.headers.bearer
          url.password
     */
    redactFields?: string[]
  }
}

export interface IFastifyConfig {
  serviceName: string
  port?: number
  fastify?: IFastifyAppConfig
  cors?: any
  cache?: {
    /**
     * Default time in ms to cache when reply.cache without a value is used
     * @default {number} 60000
     */
    defaultTTL: number
  }
  sitemap?: ISitemapOptions
}

export default function fastify(config: IFastifyConfig): Promise<FastifyInstance>
