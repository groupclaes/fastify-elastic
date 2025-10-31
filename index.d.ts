import { FastifyInstance } from 'fastify'

export interface IFastifyAppConfig {
  logger?: boolean | IFastifyLoggerConfig,
  requestLogging?: boolean,
  disableRequestLogging?: boolean,
  /**
   * @deprecated
   */
  securityHeaders?: boolean,
  additionalSecurityHeaders?: boolean
}

export interface IFastifyLoggerConfig {
  level?: string | 'info',
  ecs?: {
    /**
     * Specify if running in a container (default true)
     * @default true
     */
    containerized?: boolean
    /**
     * Show the host uptime.
     * @requires containerized to be set false
     */
    showUptime?: boolean
  }
}

export interface IFastifyConfig {
  serviceName: string
  port?: number
  fastify?: IFastifyAppConfig,
  ecs?: IFastifyECSConfig
  cors?: any
}

export default function fastify(config: IFastifyConfig): Promise<FastifyInstance>
