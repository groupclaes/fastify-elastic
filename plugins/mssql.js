const fastifyPlugin = require('fastify-plugin')
const sql = require('mssql')

module.exports = fastifyPlugin(mssql)

const pools = new Map()
/**
 * @type {{[key: string]: sql.config}}
 */
let mssql_connections = {}

/**
 * @param {import ('fastify').FastifyInstance} fastify 
 * @param {any} opts
 */
async function mssql(fastify, opts) {
  mssql_connections = opts

  fastify.decorateRequest('getSqlPool')
  fastify.decorateRequest('closeAllSqlPools')

  fastify.addHook('onRequest', async function (r) {
    r.getSqlPool = getSqlPool
    r.closeAllSqlPools = closeAllSqlPools
  })
}

/**
 * 
 * @param {string} name
 * @returns {Promise<sql.ConnectionPool>} 
 */
async function getSqlPool(name) {
  if (!pools.has(name)) {
    if (!mssql_connections[name]) {
      throw new Error(`Configuration for pool '${name}' does not exist!`)
    }
    const pool = new sql.ConnectionPool(mssql_connections[name])
    const close = pool.close.bind(pool)
    pool.close = (...args) => {
      pools.delete(name)
      return close(...args)
    }
    pools.set(name, await pool.connect())
  }
  return pools.get(name)
}

/**
 * @returns {Promise<sql.ConnectionPool[]>}
 */
async function closeAllSqlPools() {
  return Promise.all(Array.from(pools.values()).map((connect) => {
    return connect.then((pool) => pool.close())
  }))
}