import fastify from './index.js'

async function start()  {
  const app = await fastify({
    serviceName: 'bobs-testshed',
    fastify: {
      logger: {
        requestLogging: true,
        ecs:
        {
          containerized: true
        }
      }
    },
    sitemap: {
      baseUrl: 'http://localhost',
      cache: 60000,
      i18n: {
        prefix: true
      },
      dynamicRoutes: async (language) => {
        const environment = {
          api: {
            vacancies: 'https://www.groupclaes.be/api/v2/vacancies',
            legacyVacancies: 'https://api.groupclaes.be/v1/groupclaes/vacancies'
          },
          supportedLanguages: ['nl', 'fr', 'de']
        }

        const toSlug = (s) => 
          encodeURIComponent(
            s.normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '')
          );

        
        const urls = []
        if (language) {
          const vacanciesResponse = await fetch(environment.api.vacancies)
        
          const vacanciesData = (await vacanciesResponse.json()) // as ClaesVacanciesResponse
          const vacancies = Array.isArray(vacanciesData?.data?.vacancies) ? vacanciesData.data.vacancies : []
          if (vacancies.length === 0) { return }

          let legacyById//: Map<number, any>
          if (vacancies.some(v => v.legacy === 1)) {

            const legacyResponse = await fetch(environment.api.legacyVacancies)
            if (legacyResponse.ok) {
              legacyById = new Map((await legacyResponse.json()).result.map((v/*: any*/) => [v.id, v]));
            }
          }

          urls.push(...vacancies.map(v => {
            let title = v.title
            if (v.legacy === 1) {
              const legacy = legacyById.get(v.id);
              const localized = legacy?.title?.[language] ??
                (legacy?.title ? Object.values(legacy.title)[0] : undefined);
              if (localized) title = localized;
            }

            const slugPath = `/vacatures/${v.id}/${toSlug(title)}`

            /**
             * @type {import('./plugins/sitemap.d').ISitemapRoute}
             */
            return {
              path: slugPath,
              language: v.locale,
              changeFrequency: "daily",
              lastModified: new Date(v.publishedDate),
              translations: environment.supportedLanguages.filter(x => x !== v.locale)
                .map(language => ({
                  path: slugPath,
                  language
                }))
            }
          }))
        }

        return urls
      },
      // routes: [
      //   {
      //     path: '/',
      //     language: 'nl',
      //     translations: [
      //       {
      //         path: '/',
      //         language: 'fr',
      //         changeFrequency: 'always',
      //         priority: 0.5,
      //       },
      //       {
      //         path: '/',
      //         language: 'de',
      //         changeFrequency: 'always',
      //         priority: 0.5,
      //       }
      //     ]
      //   },
      //   {
      //     path: '/vacatures',
      //     language: 'nl',
      //     translations: [
      //       {
      //         path: '/offres-d-emploi',
      //         language: 'fr',
      //         changeFrequency: 'always',
      //         priority: 0.5
      //       },
      //       {
      //         path: '/stellenangebote',
      //         language: 'de',
      //         changeFrequency: 'always',
      //         priority: 0.5
      //       }
      //     ]
      //   }
      // ]
      routes: [
        {
          path: '/hallo',
          language: 'nl',
          translations: [
            {
              path: '/bonjour',
              language: 'fr',
              changeFrequency: 'always',
              priority: 0.5,
            },
            {
              path: '/guten-tag',
              language: 'de',
              changeFrequency: 'always',
              priority: 0.5,
            }
          ]
        },
        {
          path: '/vacatures',
          language: 'nl',
          translations: [
            {
              path: '/offres-d-emploi',
              language: 'fr',
              changeFrequency: 'always',
              priority: 0.5
            },
            {
              path: '/stellenangebote',
              language: 'de',
              changeFrequency: 'always',
              priority: 0.5
            }
          ]
        }
      ]
    }
  })

  app.listen({ port: 8080 })
}

start()
