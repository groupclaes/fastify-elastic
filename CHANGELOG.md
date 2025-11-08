# @groupclaes/fastify-elastic changelog

## Version 5.1.5
### Fixes
* Bug - Fix generic configuration requiring sitemap
* Bug - Fix sitemap options interface requiring dynamic routes to be defined
* Bug - Fix sitemap route requiring priority to be set

## Version 5.1.3
### Features
* Modify: Healthcheck endpoint returns json object with alive boolean property instead of empty string
* Modify: Exclude healthchecks from request logging (again)
* Add: Sitemap handler with dynamic route function -> Must be enabled in config
* Add: Sitemap per language (if prefixed)
* Add: Sitemap index if prefixed languages are used
* Add: Implement caching for sitemaps when cache is available

### Dependencies
* Add: `@fastify/caching@^9.0.3`

## Version 5.1.1
### Features
* Add: ECS types
* Add: ECS v8 format logging
* Add: JSON-flat based logging format


## Version 5.1.0
### Features
* Modify: X-Request-Id can be used to set the Fastify request id. If unset, the default {hostname}-{requestId} will be used.
* Add: testing for request-id plugin
* Modify: Include healthchecks in request logging

### Dependencies
* Add: `tap@^21.1.1` development dependency
* Remove: `@elastic/ecs-pino-format`
* Remove: `@logtail/pino`
* Remove: `pino-elasticsearch`
* Upgrade: `pino@^9.9.9` -> `pino@^10.1.0`
* Upgrade: `fastify@^5.5.0` -> `fastify@^5.6.1`
* Upgrade: `fastify-plugin@^5.0.1` -> `fastify-plugin@^5.1.0`