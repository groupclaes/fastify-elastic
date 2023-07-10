'use strict'

const fastify = require('fastify')

// export interface IBaseAPIResponse {
//   status: 'error' | 'success' | 'fail'
//   code?: number // HTTP status code
//   message?: string // Required when status is 'error'
//   data?: { [key: string]: any } | any // Required if status is 'success' or 'fail', data should never be an array
//   executionTime?: number // Optional: Execution time in milliseconds
// }

/**
 * Return a sucessful response
 * @param {fastify.FastifyReply} reply
 * @param {any | null} data
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {fastify.FastifyReply}
 */
const success = function (reply, data, code = 200, executionTime = undefined) {
  return reply
    .code(code)
    .send({
      status: 'success',
      code,
      data,
      executionTime
    })
}

/**
 * Return a failed response
 * @param {fastify.FastifyReply} reply
 * @param {any | null} data
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {fastify.FastifyReply}
 */
const fail = function (reply, data, code = 400, executionTime = undefined) {
  return reply
    .code(code)
    .send({
      status: 'fail',
      code,
      data,
      executionTime
    })
}

/**
 * Return a error response
 * @param {fastify.FastifyReply} reply
 * @param {string} message
 * @param {number | undefined} code
 * @param {number | undefined} executionTime
 * @returns {fastify.FastifyReply}
 */
const error = function (reply, message, executionTime = undefined) {
  return reply
    .code(code)
    .send({
      status: 'error',
      code,
      message,
      executionTime
    })
}

module.exports = {
  success,
  fail,
  error
}