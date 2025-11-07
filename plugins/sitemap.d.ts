import { FastifyInstance } from 'fastify';
export interface ISitemapBaseRoute {
  path: string
  language?: string
  lastModified?: Date | string
  changeFrequency:
    'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  /**
   * @description Allowed values between 0.1 and 1.0
   */
  priority: number
}
export interface ISitemapRoute extends ISitemapBaseRoute {
  translations?: ISitemapBaseRoute[]
}

export interface ISitemapOptions {
  routes: ISitemapRoute[]
  baseUrl: string
  /**
   * @default 3600000
   */
  cache?: number
  i18n?: {
    /**
     * @default {boolean} true
     */
    prefix: boolean
    /**
     * @default {string} /{{language}}
     */
    prefixFormat: string
  }
  dynamicRoutes: (language?: string) => ISitemapRoute[] | Promise<ISitemapRoute[]>
}

export function sitemapPlugin(fastifyPlugin: FastifyInstance, options: ISitemapOptions): Promise<void>