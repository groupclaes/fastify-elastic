const fastifyPlugin = require('fastify-plugin')
const sql = require('mssql')
const { env } = require('process')

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

  fastify.decorate('getSqlPool')
  fastify.decorate('closeAllSqlPools')

  fastify.getSqlPool = getSqlPool
  fastify.closeAllSqlPools = closeAllSqlPools
}

/**
 * 
 * @param {string?} name
 * @returns {Promise<sql.ConnectionPool>} 
 */
async function getSqlPool(name) {
  if (!name && env['DB_NAME'])
    name = env['DB_NAME']
  else if (!name)
    throw new Error('No connection name supplied')
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