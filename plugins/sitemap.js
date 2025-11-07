import fastifyPlugin from "fastify-plugin"

/**
 * @type {import('./sitemap.d').ISitemapOptions}
 */
let sitemapPluginOptions = undefined

const sitemapModifications = {}

/**
 * Resolve and error handle dynamic routes
 * 
 * @param {string} language 
 * @returns {Promise<string>}
 */
async function resolveDynamicRoutes(language) {
  if (sitemapPluginOptions.dynamicRoutes) {
    const routes = await Promise.resolve(sitemapPluginOptions.dynamicRoutes(language))
    if (routes?.length > 0) {
      return routes
    }

    return []
  }
}

/**
 * Generate a XML urlset sitemap based on the specified language prefix
 * 
 * @param {string} language
 * @returns {Promise<string>} XML-based urlset document to serve as a sitemap
 */
async function generateLanguageUrlSet(language) {
  let baseUrl = sitemapPluginOptions.baseUrl
  if (sitemapPluginOptions.i18n?.prefix) {
    baseUrl += sitemapPluginOptions.i18n.prefixFormat.replace('{{language}}', language)
  }

  /**
   * @type {import('./sitemap.d').ISitemapBaseRoute[]}
   */
  const routes = sitemapPluginOptions.routes
    .map(x => x.language === language
      ? x
      : x.translations.find(y => y.language === language)
    )

  // Get the statically defined routes for in the config
  routes.push(...await resolveDynamicRoutes(language))
  
  
  const urlSet = routes.map(x => {
      let optionalFields = ''
      if (x.lastModified && x.changeFrequency != 'always') {
        optionalFields += `<lastmod>${
          x.lastModified instanceof Date
            ? x.lastModified.toISOString() : x.lastModified
        }</lastmod>`
      }

      if (x.changeFrequency) {
        optionalFields += `<changefreq>${x.changeFrequency}</changefreq>`
      }

      if (x.priority) {
        optionalFields += `<priority>${x.priority}</priority>`
      }
      return `<url><loc>${baseUrl}${x.path}</loc>${optionalFields}</url>`
    }).join('')

  sitemapModifications[language] = new Date()
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlSet}</urlset>`
}

/**
 * Parse a route to xhtml:link
 * 
 * @param {import("./sitemap.d").ISitemapBaseRoute} route 
 * @returns {string} The xhtml link string
 */
function getRouteXHtmlLink(route, overrideLanguage) {
  return `<xhtml:link rel="alternate" hreflang="${overrideLanguage ? overrideLanguage : route.language}" href="${sitemapPluginOptions.baseUrl}${route.path}" />`
}

/**
 * Parse a route to the base optional fields
 * 
 * @param {import("./sitemap.d").ISitemapBaseRoute} route 
 * @returns {string} Partial xml string containing the base optional fields
 */
function getBaseUrlOptionalFields(route) {
  let optionalFields = ''
  if (route.lastModified && route.changeFrequency != 'always') {
    optionalFields += `<lastmod>${
      route.lastModified instanceof Date
        ? route.lastModified.toISOString() : route.lastModified
    }</lastmod>`
  }

  if (route.changeFrequency) {
    optionalFields += `<changefreq>${route.changeFrequency}</changefreq>`
  }

  if (route.priority) {
    optionalFields += `<priority>${route.priority}</priority>`
  }

  return optionalFields
}

function getUrlEntry(route) {
  let optionalFields = getBaseUrlOptionalFields(route)

  if (route.translations?.length > 0) {
    // Get all the parent xmlroute links
    const xhtmlLinks = getRouteXHtmlLink(route) + getRouteXHtmlLink(route, 'x-default')
      // Get all the child xhtml:links
      + route.translations.map(x => getRouteXHtmlLink(x)).join('')
    
    optionalFields += xhtmlLinks


    // Create root entries for the child translations
    const childUrls = route.translations.map(
      childRoute => `<url><loc>${sitemapPluginOptions.baseUrl}${childRoute.path}</loc>${getBaseUrlOptionalFields(childRoute)}${xhtmlLinks}</url>`)


    return `<url><loc>${sitemapPluginOptions.baseUrl}${route.path}</loc>${optionalFields}</url>${childUrls.join('')}`
  }

  return `<url><loc>${sitemapPluginOptions.baseUrl}${route.path}</loc>${optionalFields}</url>`
}

/**
 * Generate a XML urlset for with the default language as base, and links to
 * alternative routes for different languages
 * @returns {Promise<string>} XML-based urlset sitemap with alternative routes for languages
 */
async function generateGlobalUrlSet() {
  const routes = [...sitemapPluginOptions.routes]
  routes.push(...await resolveDynamicRoutes())

  const urls = sitemapPluginOptions.routes.map(getUrlEntry)

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
}

/**
 * Generate a XML sitemapindex based on all prefixed route languages
 * 
 * @returns {string} XML-based sitemapindex document to serve as the root
 * sitemap
 */
function generateSitemapIndex() {
  // This is the general sitemapindex with all languages in sub sitemaps.
  const sitemaps = [
    ...new Set(
      sitemapPluginOptions.routes.flatMap(
        x => [x.language, ...x.translations.map(y => y.language)]
      )
    )
  ].map(language => {
    let sitemap = `<sitemap><loc>${sitemapPluginOptions.baseUrl}${
        sitemapPluginOptions.i18n.prefixFormat
          .replace('{{language}}', language)}/sitemap.xml</loc>`

    if (sitemapModifications[language]) {
      sitemap += `<lastmod>${sitemapModifications[language].toISOString()}</lastmod>`
    }

    return sitemap + `</sitemap>`
  }).join('')
  

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`
}

/**
 * Generate the sitemap for this service
 * 
 * @param {string} language
 * @returns {Promise<string>} Either an XML Urlset sitemap or a sitemap index when no
 * language is provided with prefix enabled.
 */
function generateSitemap(language) {
  /**
   * @type {string}
   */
  if (language) {
    return generateLanguageUrlSet(language)
  } else if (sitemapPluginOptions.i18n?.prefix) {
    return Promise.resolve(generateSitemapIndex())
  } else {
    // No prefix paths are set, so use all subroutes as alternative links
    return generateGlobalUrlSet()
  }
}


/**
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {import('./sitemap.d').ISitemapOptions} options 
 */
function sitemapPlugin(fastify, options) {
  if (options) {
    sitemapPluginOptions = options

    if (sitemapPluginOptions.i18n?.prefix && !sitemapPluginOptions.i18n.prefixFormat) {
      sitemapPluginOptions.i18n.prefixFormat = '/{{language}}'
    }
  } else {
    throw new Error("Options must be provided")
  }

  // Registering sitemap handlers
  fastify.get('/sitemap.xml', async (_, res) => {
    if (res.cache) {
      res.cache(sitemapPluginOptions.cache ?? 3600000)
    }

    res.header('Content-Type', 'application/xml')
    res.send(await generateSitemap())
  })

  if (sitemapPluginOptions.i18n?.prefix) {
    fastify.get('/:language/sitemap.xml', async (req, res) => {
      if (res.cache) {
        res.cache(sitemapPluginOptions.cache ?? 3600000)
      }

      res.header('Content-Type', 'application/xml')
      res.send(await generateSitemap(req.params.language))
    })
  }
}

export default fastifyPlugin(sitemapPlugin)